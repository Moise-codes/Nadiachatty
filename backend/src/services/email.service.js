import nodemailer from 'nodemailer'

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
})

const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:Inter,sans-serif;background:#000;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" style="max-width:480px;">
        <!-- Header -->
        <tr>
          <td align="center" style="padding:0 0 28px;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <div style="width:44px;height:44px;background:linear-gradient(135deg,#7c3aed,#9333ea);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:22px;">💬</span>
              </div>
              <span style="font-size:1.4rem;font-weight:600;color:#fff;letter-spacing:-0.02em;">NadiaChatty</span>
            </div>
          </td>
        </tr>
        <!-- Card -->
        <tr>
          <td style="background:rgba(18,18,28,1);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td align="center" style="padding:24px 0 0;color:rgba(255,255,255,0.25);font-size:0.75rem;">
            © ${new Date().getFullYear()} NadiaChatty. All rights reserved.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

export const sendWelcomeEmail = async ({ to, fullName }) => {
  const transporter = createTransporter()
  const html = baseTemplate('Welcome to NadiaChatty!', `
    <h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin:0 0 12px;">Welcome, ${fullName}! 🎉</h2>
    <p style="color:rgba(255,255,255,0.55);font-size:0.9rem;line-height:1.6;margin:0 0 20px;">
      Your NadiaChatty account is ready. Start connecting with friends, make calls, share moments, and chat in real time.
    </p>
    <a href="${process.env.CLIENT_URL}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#9333ea,#7c3aed);color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:0.9rem;">
      Open NadiaChatty →
    </a>
  `)
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject: 'Welcome to NadiaChatty! 🎉', html })
}

export const sendPasswordResetEmail = async ({ to, fullName, resetUrl }) => {
  const transporter = createTransporter()
  const html = baseTemplate('Reset Your Password', `
    <h2 style="color:#fff;font-size:1.25rem;font-weight:600;margin:0 0 12px;">Reset your password</h2>
    <p style="color:rgba(255,255,255,0.55);font-size:0.9rem;line-height:1.6;margin:0 0 8px;">Hi ${fullName},</p>
    <p style="color:rgba(255,255,255,0.55);font-size:0.9rem;line-height:1.6;margin:0 0 20px;">
      We received a request to reset your password. Click the button below — this link expires in <strong style="color:#9333ea">1 hour</strong>.
    </p>
    <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#9333ea,#7c3aed);color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:0.9rem;">
      Reset Password →
    </a>
    <p style="color:rgba(255,255,255,0.3);font-size:0.78rem;margin:20px 0 0;">
      If you didn't request this, you can safely ignore this email.
    </p>
  `)
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject: 'Reset your NadiaChatty password', html })
}

export const sendNewMessageNotification = async ({ to, fromName, preview }) => {
  const transporter = createTransporter()
  const html = baseTemplate('New Message', `
    <h2 style="color:#fff;font-size:1.1rem;font-weight:600;margin:0 0 12px;">You have a new message 💬</h2>
    <p style="color:rgba(255,255,255,0.55);font-size:0.9rem;margin:0 0 8px;"><strong style="color:#c084fc">${fromName}</strong> sent you a message:</p>
    <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);border-radius:8px;padding:12px 16px;margin:0 0 20px;">
      <p style="color:#e2e8f0;font-size:0.875rem;margin:0;font-style:italic;">"${preview}"</p>
    </div>
    <a href="${process.env.CLIENT_URL}" style="display:inline-block;padding:11px 24px;background:linear-gradient(135deg,#9333ea,#7c3aed);color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:0.875rem;">
      Reply Now →
    </a>
  `)
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject: `New message from ${fromName}`, html })
}
