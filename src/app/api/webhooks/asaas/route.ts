import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const asaasToken = request.headers.get("asaas-access-token");
    const secret = process.env.ASAAS_WEBHOOK_SECRET;

    // Only validate token if a secret is configured
    if (secret && secret.length > 0 && asaasToken !== secret) {
      console.log("[Webhook] Token mismatch. Received:", asaasToken, "Expected:", secret?.substring(0, 10) + "...");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const payload = await request.json();
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

      await supabaseAdmin
        .from('billing_invoices')
        .insert({
          user_id: userId,
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
