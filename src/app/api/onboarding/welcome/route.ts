import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { render } from '@react-email/render';
import WelcomeEmail from '@/emails/WelcomeEmail';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!resend) {
      return NextResponse.json({ error: "RESEND_API_KEY is not configured" }, { status: 500 });
    }

    // Render the React Email to HTML
    const html = await render(WelcomeEmail({
      userName: user.user_metadata?.name || 'Usuário',
    }));

    // Send the email
    const data = await resend.emails.send({
      from: 'Zebro <onboarding@resend.dev>',
      to: [user.email],
      subject: 'Bem-vindo ao Zebro! 🦓',
      html: html,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Welcome Email Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
