const nodemailer = require('nodemailer');

let testTransporter = null;

// Get transporter: Real Gmail/SMTP if configured, otherwise Ethereal
async function getTransporter() {
  // If user configured real email in .env (e.g. Gmail App Password)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log(`📧 Using Real SMTP (${process.env.EMAIL_USER})`);
    return {
      transporter: nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      }),
      isReal: true
    };
  }

  // Fallback: Ethereal test account
  if (!testTransporter) {
    const testAccount = await nodemailer.createTestAccount();
    testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('📧 Ethereal Email account active:', testAccount.user);
  }

  return {
    transporter: testTransporter,
    isReal: false
  };
}

// Generate random 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email with 6-digit code
async function sendVerificationEmail(toEmail, code) {
  const { transporter, isReal } = await getTransporter();

  const fromAddress = process.env.EMAIL_USER 
    ? `"EduHub Platform" <${process.env.EMAIL_USER}>`
    : '"EduHub Platform" <noreply@eduhub.uz>';

  const info = await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: `🔐 EduHub — Tasdiqlash kodi: ${code}`,
    text: `EduHub O'quv Platformasi\n\nSizning 6 xonali tasdiqlash kodingiz: ${code}\n\nBu kod 5 daqiqa davomida amal qiladi.\nAgar siz ro'yxatdan o'tmagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring.`,
    html: `
      <div style="max-width:500px;margin:20px auto;font-family:'Segoe UI',Arial,sans-serif;background:#0d0d11;color:#f3f4f6;border-radius:18px;overflow:hidden;border:1px solid #27272a;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
        <div style="height:5px;background:linear-gradient(90deg,#10b981,#34d399,#6366f1)"></div>
        <div style="padding:40px 32px;text-align:center">
          <div style="display:inline-block;padding:10px 18px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:50px;color:#34d399;font-weight:700;font-size:13px;margin-bottom:20px;letter-spacing:0.5px">
            EDUHUB O'QUV MARKAZI
          </div>
          <h2 style="font-size:24px;font-weight:800;color:#ffffff;margin:0 0 10px;letter-spacing:-0.5px">
            Email Tasdiqlash
          </h2>
          <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 28px">
            EduHub platformasida hisobingizni faollashtirish uchun quyidagi 6 xonali kodni kiriting:
          </p>

          <div style="background:#18181b;border:2px dashed #10b981;border-radius:14px;padding:24px;margin-bottom:24px;display:inline-block;min-width:280px">
            <span style="font-size:40px;font-weight:900;letter-spacing:14px;color:#34d399;font-family:'Courier New',Courier,monospace;padding-left:14px">
              ${code}
            </span>
          </div>

          <p style="color:#a1a1aa;font-size:13px;margin:0 0 8px">
            ⏱️ Kod <strong>5 daqiqa</strong> davomida amal qiladi
          </p>
          <p style="color:#52525b;font-size:12px;margin:0">
            Agar siz EduHub'da ro'yxatdan o'tmagan bo'lsangiz, bu xatni o'chirib tashlang.
          </p>
        </div>
        <div style="background:#111114;padding:16px;text-align:center;font-size:12px;color:#52525b;border-top:1px solid #1e1e24">
          © 2026 EduHub Platform. Barcha huquqlar himoyalangan.
        </div>
      </div>
    `
  });

  const previewUrl = !isReal ? nodemailer.getTestMessageUrl(info) : null;

  console.log(`📨 Email sent to ${toEmail} | Real: ${isReal} | Code: ${code}`);
  if (previewUrl) {
    console.log(`   Preview link: ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    previewUrl,
    isReal
  };
}

module.exports = { generateCode, sendVerificationEmail };
