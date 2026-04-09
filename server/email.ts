import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use verified domain when available, fallback to Resend's onboarding address for testing
const FROM_EMAIL = "contact@liota.institute";
const FROM_NAME = "LIOTA Institute";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    if (error) {
      console.error("[Resend] Email send error:", error);
      return { success: false, error: error.message };
    }

    console.log("[Resend] Email sent successfully:", data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Resend] Unexpected error:", message);
    return { success: false, error: message };
  }
}

export function buildInvitationEmail(opts: {
  inviteeName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  message?: string;
}): string {
  const roleLabel = opts.role.charAt(0).toUpperCase() + opts.role.slice(1);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to LIOTA CRM</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 40px; text-align: center;">
      <h1 style="color: #f59e0b; margin: 0; font-size: 28px; letter-spacing: 2px;">LIOTA</h1>
      <p style="color: #94a3b8; margin: 4px 0 0; font-size: 14px;">Language Institute of The Americas</p>
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <h2 style="color: #1a1a2e; margin: 0 0 16px;">You've been invited!</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        <strong>${opts.inviterName}</strong> has invited you to join the <strong>LIOTA CRM</strong> as a <strong>${roleLabel}</strong>.
      </p>
      
      ${opts.message ? `
      <div style="background: #f8fafc; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 0 0 24px;">
        <p style="color: #4b5563; margin: 0; font-style: italic;">"${opts.message}"</p>
      </div>
      ` : ""}

      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px;">
        Click the button below to accept your invitation and set up your account. This link expires in <strong>7 days</strong>.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${opts.inviteUrl}" 
           style="background: #f59e0b; color: #1a1a2e; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
          Accept Invitation →
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 12px; margin: 24px 0 0; text-align: center;">
        If you can't click the button, copy and paste this link:<br>
        <a href="${opts.inviteUrl}" style="color: #f59e0b;">${opts.inviteUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        © 2026 Language Institute of The Americas (LIOTA)<br>
        <a href="https://liota.institute" style="color: #f59e0b;">liota.institute</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function buildBulkEmailHtml(opts: {
  subject: string;
  body: string;
  recipientName?: string;
}): string {
  // Replace template variables
  let html = opts.body
    .replace(/\{\{student_name\}\}/g, opts.recipientName || "Student")
    .replace(/\n/g, "<br>");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.subject}</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px 40px; text-align: center;">
      <h1 style="color: #f59e0b; margin: 0; font-size: 22px; letter-spacing: 2px;">LIOTA INSTITUTE</h1>
      <p style="color: #94a3b8; margin: 4px 0 0; font-size: 12px;">Language Institute of The Americas</p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 40px;">
      <div style="color: #374151; line-height: 1.8; font-size: 15px;">
        ${html}
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        © 2026 Language Institute of The Americas (LIOTA)<br>
        <a href="https://liota.institute" style="color: #f59e0b;">liota.institute</a> | 
        <a href="mailto:contact@liota.institute" style="color: #f59e0b;">contact@liota.institute</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
