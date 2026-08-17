import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { TeamInviteEmail } from '@/emails/TeamInviteEmail';
import { render } from '@react-email/render';

export async function POST(request: Request) {
  try {
    const { email, inviterName, workspaceName, role, inviteLink } = await request.json();

    if (!email || !workspaceName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!resend) {
      return NextResponse.json({ error: "RESEND_API_KEY is not configured" }, { status: 500 });
    }

    const html = await render(TeamInviteEmail({ inviterName, workspaceName, role, inviteLink }));

    const data = await resend.emails.send({
      from: 'Zebro <suporte@zebro.site>', // Make sure this domain is verified in Resend
      to: [email],
      subject: `Você foi convidado para colaborar no workspace ${workspaceName}`,
      html: html,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Team Invite Email Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
