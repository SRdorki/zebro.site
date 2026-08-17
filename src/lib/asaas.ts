export const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

// We check if it already starts with $ to prevent double $$
function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY_BODY || process.env.ASAAS_API_KEY;
  if (!key) throw new Error("Asaas API key is not configured.");
  return key.startsWith('$') ? key : '$' + key;
}

type AsaasCustomer = {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
};

export async function createAsaasCustomer(data: AsaasCustomer) {
  const key = getApiKey();
  const response = await fetch(`${ASAAS_API_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'access_token': key },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Erro ao criar cliente: ${JSON.stringify(err)}`);
  }
  return response.json();
}

type AsaasSubscription = {
  customer: string;
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'YEARLY';
  description: string;
};

export async function createAsaasSubscription(data: AsaasSubscription) {
  const key = getApiKey();
  const response = await fetch(`${ASAAS_API_URL}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'access_token': key },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Erro ao criar assinatura: ${JSON.stringify(err)}`);
  }
  return response.json();
}

export async function getSubscriptionPayments(subscriptionId: string) {
  const key = getApiKey();
  const response = await fetch(`${ASAAS_API_URL}/payments?subscription=${subscriptionId}`, {
    headers: { 'access_token': key }
  });
  if (!response.ok) throw new Error("Erro ao buscar cobranças");
  return response.json();
}

export async function getPixQrCode(paymentId: string) {
  const key = getApiKey();
  const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
    headers: { 'access_token': key }
  });
  if (!response.ok) throw new Error("Erro ao gerar QR Code PIX");
  return response.json();
}

export async function getAsaasPayments(customerId: string) {
  const key = getApiKey();
  const response = await fetch(`${ASAAS_API_URL}/payments?customer=${customerId}`, {
    headers: { 'access_token': key }
  });
  if (!response.ok) throw new Error("Erro ao buscar pagamentos");
  return response.json();
}
