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

export function buildLeadAssignmentEmail(opts: {
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  stage: string;
  source?: string;
  notes?: string;
  assignedToName?: string;
  assignerName: string;
  crmUrl?: string;
}): string {
  const stageLabel: Record<string, string> = {
    new_lead: "New Lead",
    contacted: "Contacted",
    trial_scheduled: "Trial Scheduled",
    trial_done: "Trial Done",
    proposal_sent: "Proposal Sent",
    enrolled: "Enrolled",
    lost: "Lost",
  };
  const stage = stageLabel[opts.stage] ?? opts.stage;
  const crmUrl = opts.crmUrl ?? "https://liota.institute";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead Assigned</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 28px 40px; text-align: center;">
      <h1 style="color: #f59e0b; margin: 0; font-size: 26px; letter-spacing: 2px;">LIOTA</h1>
      <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Language Institute of The Americas</p>
    </div>

    <!-- Alert Banner -->
    <div style="background: #fef3c7; border-bottom: 3px solid #f59e0b; padding: 16px 40px; text-align: center;">
      <p style="color: #92400e; margin: 0; font-weight: bold; font-size: 15px;">📋 New Lead Assigned to Marketing</p>
    </div>

    <!-- Body -->
    <div style="padding: 36px 40px;">
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px;">
        <strong>${opts.assignerName}</strong> has assigned a new lead to the Marketing team.
        ${opts.assignedToName ? `Specifically assigned to: <strong>${opts.assignedToName}</strong>.` : ""}
      </p>

      <!-- Lead Details Card -->
      <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
        <h3 style="color: #1a1a2e; margin: 0 0 16px; font-size: 16px;">Lead Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 120px;">Name</td>
            <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600;">${opts.leadName}</td>
          </tr>
          ${opts.leadEmail ? `<tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Email</td><td style="padding: 6px 0; color: #111827; font-size: 13px;">${opts.leadEmail}</td></tr>` : ""}
          ${opts.leadPhone ? `<tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Phone</td><td style="padding: 6px 0; color: #111827; font-size: 13px;">${opts.leadPhone}</td></tr>` : ""}
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Stage</td>
            <td style="padding: 6px 0;"><span style="background: #dbeafe; color: #1d4ed8; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${stage}</span></td>
          </tr>
          ${opts.source ? `<tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Source</td><td style="padding: 6px 0; color: #111827; font-size: 13px;">${opts.source}</td></tr>` : ""}
          ${opts.notes ? `<tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px; vertical-align: top;">Notes</td><td style="padding: 6px 0; color: #374151; font-size: 13px; font-style: italic;">${opts.notes}</td></tr>` : ""}
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${crmUrl}/leads"
           style="background: #f59e0b; color: #1a1a2e; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
          View Lead in CRM →
        </a>
      </div>
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
