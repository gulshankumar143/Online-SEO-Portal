"use strict";

const nodemailer = require("nodemailer");

class EmailConfigurationError extends Error {}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    })[character]);
}

function createInquiryEmail(inquiry) {
    const name = escapeHtml(inquiry.name);
    const email = escapeHtml(inquiry.email);
    const phone = escapeHtml(inquiry.phone || "Not provided");
    const service = escapeHtml(inquiry.service);
    const message = escapeHtml(inquiry.message);
    const receivedAt = new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC"
    }).format(inquiry.createdAt || new Date()) + " UTC";

    return {
        subject: `New consultation request: ${inquiry.service}`,
        text: [
            "ONLINE SEO PORTAL",
            "New consultation request",
            "",
            `Received: ${receivedAt}`,
            `Service: ${inquiry.service}`,
            "",
            "CONTACT DETAILS",
            `Name: ${inquiry.name}`,
            `Email: ${inquiry.email}`,
            `Phone: ${inquiry.phone || "Not provided"}`,
            "",
            "MESSAGE",
            inquiry.message,
            "",
            "Reply directly to this email to contact the requester."
        ].join("\n"),
        html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>New consultation request</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#17233b;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">A new ${service} consultation request is ready for review.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;background-color:#123b82;color:#ffffff;">
              <p style="margin:0 0 8px;font-size:12px;line-height:18px;font-weight:bold;letter-spacing:1.5px;color:#bfdbfe;">ONLINE SEO PORTAL</p>
              <h1 style="margin:0;font-size:24px;line-height:32px;font-weight:700;color:#ffffff;">New consultation request</h1>
              <p style="margin:8px 0 0;font-size:14px;line-height:22px;color:#e2e8f0;">A prospective client has contacted your team.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 12px;">
              <p style="margin:0 0 8px;font-size:12px;line-height:18px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#64748b;">Requested service</p>
              <span style="display:inline-block;padding:7px 12px;border-radius:20px;background-color:#eff6ff;color:#1d4ed8;font-size:14px;line-height:20px;font-weight:bold;">${service}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;">
              <h2 style="margin:0 0 14px;font-size:16px;line-height:24px;color:#17233b;">Contact details</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;line-height:22px;">
                <tr>
                  <td width="110" valign="top" style="padding:7px 8px 7px 0;color:#64748b;">Name</td>
                  <td style="padding:7px 0;color:#17233b;font-weight:bold;">${name}</td>
                </tr>
                <tr>
                  <td width="110" valign="top" style="padding:7px 8px 7px 0;color:#64748b;">Email</td>
                  <td style="padding:7px 0;"><a href="mailto:${email}" style="color:#1d4ed8;text-decoration:underline;">${email}</a></td>
                </tr>
                <tr>
                  <td width="110" valign="top" style="padding:7px 8px 7px 0;color:#64748b;">Phone</td>
                  <td style="padding:7px 0;color:#17233b;">${phone}</td>
                </tr>
                <tr>
                  <td width="110" valign="top" style="padding:7px 8px 7px 0;color:#64748b;">Received</td>
                  <td style="padding:7px 0;color:#17233b;">${escapeHtml(receivedAt)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 32px 28px;">
              <h2 style="margin:0 0 12px;font-size:16px;line-height:24px;color:#17233b;">Their message</h2>
              <div style="padding:16px;border:1px solid #e2e8f0;border-left:4px solid #f97316;border-radius:6px;background-color:#f8fafc;color:#334155;font-size:14px;line-height:22px;white-space:pre-wrap;overflow-wrap:anywhere;">${message}</div>
              <p style="margin:18px 0 0;font-size:14px;line-height:22px;color:#475569;">You can reply directly to this email to respond to ${name}.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;border-top:1px solid #e2e8f0;background-color:#f8fafc;">
              <p style="margin:0;font-size:12px;line-height:18px;color:#64748b;">This notification was sent from the Online SEO Portal consultation form.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
    };
}

class EmailService {
    constructor(config = process.env) {
        const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO } = config;
        this.from = MAIL_FROM || SMTP_USER;
        this.to = MAIL_TO;
        this.configured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && this.from && MAIL_TO);
        if (this.configured && (!Number.isInteger(Number(SMTP_PORT)) ||
            Number(SMTP_PORT) < 1 || Number(SMTP_PORT) > 65535)) {
            throw new Error("SMTP_PORT must be a valid port number.");
        }
        this.transporter = this.configured
            ? nodemailer.createTransport({
                host: SMTP_HOST,
                port: Number(SMTP_PORT),
                secure: SMTP_SECURE === "true",
                auth: { user: SMTP_USER, pass: SMTP_PASS }
            })
            : null;
    }

    async sendInquiry(inquiry) {
        if (!this.transporter) {
            throw new EmailConfigurationError("Email delivery is not configured.");
        }

        const email = createInquiryEmail(inquiry);
        await this.transporter.sendMail({
            from: this.from,
            to: this.to,
            replyTo: inquiry.email,
            subject: email.subject,
            text: email.text,
            html: email.html
        });
    }

    close() {
        this.transporter?.close();
    }
}

module.exports = { EmailConfigurationError, EmailService, createInquiryEmail };
