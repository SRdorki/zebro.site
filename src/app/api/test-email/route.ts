import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

export async function POST(request: Request) {
  try {
    if (!resend) {
      return NextResponse.json({ error: "RESEND_API_KEY is not configured" }, { status: 500 });
    }

    const { email, subject, message } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const data = await resend.emails.send({
      from: 'Zebro <suporte@zebro.site>', // The official sender email
      to: [email], // In testing phase, this MUST be the email address you registered Resend with
      subject: subject || 'Test Email from Zebro',
      html: `
        <div>
          <h1>Hello!</h1>
          <p>This is a test email sent from the Zebro application using Resend.</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        </div>
      `
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Resend Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
