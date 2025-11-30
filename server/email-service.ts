import { Resend } from "resend";

// Initialize Resend client
let resend: Resend | null = null;

export function initializeResend(apiKey?: string) {
  const key = apiKey || process.env.RESEND_API_KEY;
  if (key) {
    resend = new Resend(key);
  }
  return !!resend;
}

// Initialize on module load if env variable exists
if (process.env.RESEND_API_KEY) {
  initializeResend();
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  if (!resend) {
    return {
      success: false,
      error: "Resend API key not configured. Please add RESEND_API_KEY to your environment or configure it in settings.",
    };
  }

  try {
    // Use Resend's onboarding domain for testing if no verified domain is available
    // For production, verify your domain at https://resend.com/domains
    const defaultFrom = "Agency Manager <onboarding@resend.dev>";
    const { data, error } = await resend.emails.send({
      from: options.from || defaultFrom,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
      attachments: options.attachments?.map((att) => ({
        filename: att.filename,
        content: typeof att.content === "string" ? Buffer.from(att.content, "base64") : att.content,
      })),
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

// Email templates
export function generateProposalEmailTemplate(
  companyName: string,
  clientName: string,
  proposalTitle: string,
  proposalNumber: string,
  totalAmount: string,
  validUntil: string,
  customMessage?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposal from ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${companyName}</h1>
        <p style="color: #ccfbf1; margin: 10px 0 0 0; font-size: 14px;">Business Proposal</p>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">Hello ${clientName},</h2>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          We're excited to present our proposal for your consideration. We've carefully crafted this based on our understanding of your needs and goals.
        </p>

        ${customMessage ? `
        <div style="background-color: #f9fafb; border-left: 4px solid #0d9488; padding: 15px 20px; margin: 20px 0;">
          <p style="color: #374151; margin: 0; font-style: italic;">${customMessage}</p>
        </div>
        ` : ''}

        <!-- Proposal Details Card -->
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 25px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Proposal</span>
                <p style="color: #111827; font-size: 18px; font-weight: 600; margin: 5px 0 0 0;">${proposalTitle}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 15px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%">
                      <span style="color: #6b7280; font-size: 12px;">Reference</span>
                      <p style="color: #111827; font-size: 14px; font-weight: 500; margin: 5px 0 0 0;">${proposalNumber}</p>
                    </td>
                    <td width="50%" style="text-align: right;">
                      <span style="color: #6b7280; font-size: 12px;">Valid Until</span>
                      <p style="color: #111827; font-size: 14px; font-weight: 500; margin: 5px 0 0 0;">${validUntil}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 20px;">
                <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); border-radius: 6px; padding: 15px; text-align: center;">
                  <span style="color: #ccfbf1; font-size: 12px; text-transform: uppercase;">Total Investment</span>
                  <p style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 5px 0 0 0;">${totalAmount}</p>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 25px 0;">
          Please find the detailed proposal attached to this email. We'd love to discuss this further and answer any questions you might have.
        </p>

        <p style="color: #4b5563; line-height: 1.6; margin: 0;">
          Looking forward to working together!
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #111827; padding: 30px; text-align: center;">
        <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">${companyName}</p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">This email was sent via Agency Manager</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateInvoiceEmailTemplate(
  companyName: string,
  clientName: string,
  invoiceNumber: string,
  totalAmount: string,
  dueDate: string,
  balanceDue: string,
  customMessage?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice from ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${companyName}</h1>
        <p style="color: #ccfbf1; margin: 10px 0 0 0; font-size: 14px;">Invoice</p>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">Hello ${clientName},</h2>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Please find attached your invoice for our services. We appreciate your business!
        </p>

        ${customMessage ? `
        <div style="background-color: #f9fafb; border-left: 4px solid #0d9488; padding: 15px 20px; margin: 20px 0;">
          <p style="color: #374151; margin: 0; font-style: italic;">${customMessage}</p>
        </div>
        ` : ''}

        <!-- Invoice Details Card -->
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 25px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Number</span>
                <p style="color: #111827; font-size: 18px; font-weight: 600; margin: 5px 0 0 0;">${invoiceNumber}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 15px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%">
                      <span style="color: #6b7280; font-size: 12px;">Total Amount</span>
                      <p style="color: #111827; font-size: 14px; font-weight: 500; margin: 5px 0 0 0;">${totalAmount}</p>
                    </td>
                    <td width="50%" style="text-align: right;">
                      <span style="color: #6b7280; font-size: 12px;">Due Date</span>
                      <p style="color: #111827; font-size: 14px; font-weight: 500; margin: 5px 0 0 0;">${dueDate}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 20px;">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 6px; padding: 15px; text-align: center;">
                  <span style="color: #fecaca; font-size: 12px; text-transform: uppercase;">Balance Due</span>
                  <p style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 5px 0 0 0;">${balanceDue}</p>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 25px 0;">
          Please process the payment at your earliest convenience. If you have any questions, feel free to reach out.
        </p>

        <p style="color: #4b5563; line-height: 1.6; margin: 0;">
          Thank you for your business!
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #111827; padding: 30px; text-align: center;">
        <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">${companyName}</p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">This email was sent via Agency Manager</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateContractEmailTemplate(
  companyName: string,
  clientName: string,
  contractTitle: string,
  contractNumber: string,
  contractValue: string,
  startDate: string,
  customMessage?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contract from ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${companyName}</h1>
        <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 14px;">Service Contract</p>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">Hello ${clientName},</h2>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          We're pleased to present the service contract for your review and signature. This document outlines the terms of our engagement.
        </p>

        ${customMessage ? `
        <div style="background-color: #f9fafb; border-left: 4px solid #1e40af; padding: 15px 20px; margin: 20px 0;">
          <p style="color: #374151; margin: 0; font-style: italic;">${customMessage}</p>
        </div>
        ` : ''}

        <!-- Contract Details Card -->
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 25px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Contract</span>
                <p style="color: #111827; font-size: 18px; font-weight: 600; margin: 5px 0 0 0;">${contractTitle}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 15px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%">
                      <span style="color: #6b7280; font-size: 12px;">Reference</span>
                      <p style="color: #111827; font-size: 14px; font-weight: 500; margin: 5px 0 0 0;">${contractNumber}</p>
                    </td>
                    <td width="50%" style="text-align: right;">
                      <span style="color: #6b7280; font-size: 12px;">Start Date</span>
                      <p style="color: #111827; font-size: 14px; font-weight: 500; margin: 5px 0 0 0;">${startDate}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 20px;">
                <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); border-radius: 6px; padding: 15px; text-align: center;">
                  <span style="color: #bfdbfe; font-size: 12px; text-transform: uppercase;">Contract Value</span>
                  <p style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 5px 0 0 0;">${contractValue}</p>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 25px 0;">
          Please review the attached contract carefully. Once you're ready, you can sign it digitally or print, sign, and return a scanned copy.
        </p>

        <p style="color: #4b5563; line-height: 1.6; margin: 0;">
          Looking forward to a successful partnership!
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #111827; padding: 30px; text-align: center;">
        <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">${companyName}</p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">This email was sent via Agency Manager</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Check if email service is configured
export function isEmailConfigured(): boolean {
  return !!resend;
}

// Get Resend API key status
export function getEmailServiceStatus(): { configured: boolean; provider: string } {
  return {
    configured: !!resend,
    provider: "Resend",
  };
}
