import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createAsaasCustomer,
  createAsaasSubscription,
  getSubscriptionPayments,
  getPixQrCode,
} from "@/lib/asaas";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { billingType, planValue, customerName, customerEmail, customerCpf } =
      await request.json();

    if (!["CREDIT_CARD", "PIX", "BOLETO"].includes(billingType)) {
      return NextResponse.json({ error: "Invalid billing type" }, { status: 400 });
    }

    // 1. Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let customerId = profile.asaas_customer_id;

    // 2. Create Asaas customer if needed
    if (!customerId) {
      const newCustomer = await createAsaasCustomer({
        name: customerName || profile.name || user.email || "Usuário",
        email: customerEmail || user.email!,
        cpfCnpj: customerCpf || undefined,
      });
      customerId = newCustomer.id;
      await supabase
        .from("profiles")
        .update({ asaas_customer_id: customerId })
        .eq("id", user.id);
    }

    // 3. Create Subscription
    const nextDueDate = new Date().toISOString().split("T")[0];
    const planNames: Record<string, string> = {
      "97": "Zebro Essencial",
      "197": "Zebro Pro",
      "297": "Zebro Premium",
    };

    const subscription = await createAsaasSubscription({
      customer: customerId,
      billingType: billingType as any,
      value: planValue,
      nextDueDate,
      cycle: "MONTHLY",
      description: planNames[String(planValue)] || "Zebro Assinatura",
    });

    // 4. Update profile
    await supabase
      .from("profiles")
      .update({
        asaas_subscription_id: subscription.id,
        subscription_status: "PENDING",
      })
      .eq("id", user.id);

    // 5. For PIX: get QR code from first payment
    if (billingType === "PIX") {
      const paymentsData = await getSubscriptionPayments(subscription.id);
      const firstPayment = paymentsData?.data?.[0];

      if (firstPayment?.id) {
        const pixData = await getPixQrCode(firstPayment.id);
        return NextResponse.json({
          success: true,
          subscriptionId: subscription.id,
          pixCode: pixData.payload,
          pixQrBase64: pixData.encodedImage,
          expirationDate: pixData.expirationDate,
        });
      }
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      invoiceUrl: subscription.invoiceUrl || null,
    });
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
