import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    asaasKeyLength: process.env.ASAAS_API_KEY ? process.env.ASAAS_API_KEY.length : 0,
    asaasKeyStart: process.env.ASAAS_API_KEY?.substring(0, 5),
    asaasKeyEnd: process.env.ASAAS_API_KEY?.substring(process.env.ASAAS_API_KEY.length - 5)
  });
}
