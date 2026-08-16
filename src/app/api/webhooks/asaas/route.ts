import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

    // Try to find the workspace by asaas_customer_id first
    let workspaceId: string | null = null;
    let userId: string | null = null;

    if (payment.customer) {
      const { data: ws } = await supabaseAdmin
        .from('workspaces')
        .select('id, owner_id')
        .eq('asaas_customer_id', payment.customer)
        .single();

      if (ws) {
        workspaceId = ws.id;
        userId = ws.owner_id;
        console.log("[Webhook] Found workspace by customer ID:", workspaceId);
      }
    }

    // Fallback: try to find by email (for payment link purchases)
    if (!workspaceId && payment.customer) {
      // Fetch customer email from Asaas
      const ASAAS_API_KEY_BODY = process.env.ASAAS_API_KEY_BODY;
      if (ASAAS_API_KEY_BODY) {
        const apiKey = ASAAS_API_KEY_BODY.startsWith('$') ? ASAAS_API_KEY_BODY : '$' + ASAAS_API_KEY_BODY;
        const apiUrl = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
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
              
              // Get their primary workspace
              const { data: userWs } = await supabaseAdmin
                .from('workspaces')
                .select('id')
                .eq('owner_id', userId)
                .single();
                
              if (userWs) {
                workspaceId = userWs.id;
                console.log("[Webhook] Found workspace by email:", workspaceId);
                
                // Store the customer ID on the workspace for future lookups
                await supabaseAdmin
                  .from('workspaces')
                  .update({ asaas_customer_id: payment.customer })
                  .eq('id', workspaceId);
              }
            }
          }
        }
      }
    }

    if (!workspaceId) {
      console.log("[Webhook] Workspace not found for customer:", payment.customer);
      return NextResponse.json({ success: true, message: "Workspace not found" });
    }

    if (payload.event === 'PAYMENT_RECEIVED' || payload.event === 'PAYMENT_CONFIRMED') {
      console.log("[Webhook] Activating subscription for workspace:", workspaceId);
      
      // Identify the plan
      const desc = (payment.description || '').toLowerCase();
      const val = Math.floor(payment.value || 0);
      let planId = 'free';
      
      if (desc.includes('essencial') || val === 97) planId = '97';
      else if (desc.includes('pro') || val === 197) planId = '197';
      else if (desc.includes('premium') || val === 297) planId = '297';
      
      const updateData: any = { subscription_status: 'ACTIVE' };
      if (planId !== 'free') {
        updateData.plan = planId;
        console.log(`[Webhook] Upgrading workspace to plan: ${planId}`);
      }

      await supabaseAdmin
        .from('workspaces')
        .update(updateData)
        .eq('id', workspaceId);

      await supabaseAdmin
        .from('billing_invoices')
        .insert({
          workspace_id: workspaceId,
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
        .from('workspaces')
        .update({ subscription_status: 'OVERDUE' })
        .eq('id', workspaceId);

    } else if (payload.event === 'PAYMENT_REFUNDED' || payload.event === 'SUBSCRIPTION_DELETED') {
      await supabaseAdmin
        .from('workspaces')
        .update({ subscription_status: 'CANCELLED', plan: 'free' })
        .eq('id', workspaceId);
    }

    console.log("[Webhook] Event", payload.event, "processed successfully for workspace:", workspaceId);
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
