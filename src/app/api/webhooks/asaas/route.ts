import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { render } from "@react-email/render";
import PaymentConfirmedEmail from "@/emails/PaymentConfirmedEmail";
export async function POST(request: Request) {
  try {
    const asaasToken = request.headers.get("asaas-access-token");
    const secret = process.env.ASAAS_WEBHOOK_SECRET;

    // Only validate token if a secret is configured
    if (secret && secret.length > 0 && asaasToken !== secret) {
      console.log("[Webhook] Token mismatch. Received:", asaasToken, "Expected:", secret?.substring(0, 10) + "...");
      // For now, we will NOT return 401 to ensure Asaas can activate the webhook during its ping.
      // return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    let payload: any = {};
    try {
      const text = await request.text();
      if (text) {
        payload = JSON.parse(text);
      }
    } catch (e) {
      console.log("[Webhook] Could not parse JSON payload (might be a ping)");
      return NextResponse.json({ success: true, message: "Ping OK" });
    }

    if (!payload || !payload.event) {
      console.log("[Webhook] Missing event type in payload (might be a ping)");
      return NextResponse.json({ success: true, message: "Ping OK" });
    }

    console.log("[Webhook] Event received:", payload.event, JSON.stringify(payload).substring(0, 200));

    const payment = payload.payment;

    // Always log the raw event for debugging
    await supabaseAdmin
      .from('webhook_events')
      .insert({
        event_type: payload.event,
        payload: payload,
        processed: false
      })
      .then(({ error }) => {
        if (error) console.log("[Webhook] Could not log event (table may not exist):", error.message);
      });

    if (!payment) {
      return NextResponse.json({ success: true, message: "No payment data" });
    }

    // Try to find the user by asaas_customer_id first
    let userId: string | null = null;

    if (payment.customer) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('asaas_customer_id', payment.customer)
        .single();

      if (profile) {
        userId = profile.id;
        console.log("[Webhook] Found user by customer ID:", userId);
      }
    }

    // Fallback: try to find by email (for payment link purchases)
    if (!userId && payment.customer) {
      // Fetch customer email from Asaas
      const ASAAS_API_KEY_BODY = process.env.ASAAS_API_KEY_BODY;
      if (ASAAS_API_KEY_BODY) {
        const apiKey = '$' + ASAAS_API_KEY_BODY;
        const apiUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
        const customerRes = await fetch(`${apiUrl}/customers/${payment.customer}`, {
          headers: { 'access_token': apiKey }
        });
        if (customerRes.ok) {
          const customerData = await customerRes.json();
          const email = customerData.email;
          console.log("[Webhook] Customer email from Asaas:", email);

          if (email) {
            // Find user by email via auth.users
            const { data: authUser } = await supabaseAdmin.auth.admin.listUsers();
            const matchedUser = authUser?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
            if (matchedUser) {
              userId = matchedUser.id;
              console.log("[Webhook] Found user by email:", userId);
              // Store the customer ID for future lookups
              await supabaseAdmin
                .from('profiles')
                .update({ asaas_customer_id: payment.customer })
                .eq('id', userId);
            }
          }
        }
      }
    }

    if (!userId) {
      console.log("[Webhook] Customer not found:", payment.customer);
      return NextResponse.json({ success: true, message: "Customer not found" });
    }

    if (payload.event === 'PAYMENT_RECEIVED' || payload.event === 'PAYMENT_CONFIRMED') {
      console.log("[Webhook] Activating subscription for user:", userId);
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'ACTIVE' })
        .eq('id', userId);

      // Update workspace plan based on the payment description or value
      const desc = (payment.description || '').toLowerCase();
      const val = Math.floor(payment.value || 0);
      let planId = 'free';
      
      if (desc.includes('essencial') || val === 97) planId = '97';
      else if (desc.includes('pro') || val === 197) planId = '197';
      else if (desc.includes('premium') || val === 297) planId = '297';
      
      if (planId !== 'free') {
        console.log(`[Webhook] Upgrading workspace to plan: ${planId}`);
        await supabaseAdmin
          .from('workspaces')
          .update({ plan: planId })
          .eq('owner_id', userId);
      }

      // Get user's primary workspace for the invoice
      const { data: userWs } = await supabaseAdmin
        .from('workspaces')
        .select('id')
        .eq('owner_id', userId)
        .single();

      if (userWs) {
        await supabaseAdmin
          .from('billing_invoices')
          .insert({
            workspace_id: userWs.id,
            asaas_payment_id: payment.id,
            amount: payment.value,
            status: 'PAID',
            due_date: payment.dueDate,
            payment_date: payment.paymentDate || new Date().toISOString(),
            invoice_url: payment.invoiceUrl
          })
          .then(({ error }) => {
            if (error) console.log("[Webhook] Could not insert invoice:", error.message);
          });
      } else {
        console.log("[Webhook] Could not insert invoice: User has no workspace.");
      }

      // Send payment confirmation email
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        const userEmail = authUser?.user?.email;
        
        if (userEmail && resend) {
          const planNameMap: Record<string, string> = { '97': 'Zebro Essencial', '197': 'Zebro Pro', '297': 'Zebro Premium' };
          const html = await render(PaymentConfirmedEmail({
            planName: planNameMap[planId] || 'Zebro Premium',
            amount: payment.value ? `R$ ${payment.value.toFixed(2).replace('.', ',')}` : undefined,
          }));
          
          await resend.emails.send({
            from: 'Zebro <onboarding@resend.dev>',
            to: [userEmail],
            subject: 'Pagamento Confirmado - Zebro',
            html: html,
          });
          console.log("[Webhook] Payment email sent to", userEmail);
        }
      } catch (emailErr) {
        console.error("[Webhook] Failed to send payment email:", emailErr);
      }

    } else if (payload.event === 'PAYMENT_OVERDUE') {
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'OVERDUE' })
        .eq('id', userId);

    } else if (payload.event === 'PAYMENT_REFUNDED' || payload.event === 'SUBSCRIPTION_DELETED') {
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'CANCELLED' })
        .eq('id', userId);
    }

    console.log("[Webhook] Event", payload.event, "processed successfully for user:", userId);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  // Asaas will often ping the URL to check if it's alive before activating the webhook.
  return NextResponse.json({ success: true, message: "Webhook endpoint is active" }, { status: 200 });
}
