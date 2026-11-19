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

// Generate random 6-digit password/code
function generatePassword() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send login password to user's email upon registration
async function sendPasswordEmail(toEmail, password) {
  const { transporter, isReal } = await getTransporter();

  const fromAddress = process.env.EMAIL_USER 
    ? `"EduHub Platform" <${process.env.EMAIL_USER}>`
    : '"EduHub Platform" <noreply@eduhub.uz>';

  const info = await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: `🔑 EduHub — Sizning kirish parolingiz: ${password}`,
    text: `EduHub O'quv Platformasi\n\nHisobingiz muvaffaqiyatli yaratildi!\n\nSizning saytga kirish parolingiz: ${password}\n\nSaytga kirish: http://localhost:3000\nLogin (Email): ${toEmail}\nParol: ${password}\n\nUshbu parol orqali saytga kirishingiz mumkin.`,
    html: `
      <div style="max-width:520px;margin:20px auto;font-family:'Segoe UI',Arial,sans-serif;background:#0d0d11;color:#f3f4f6;border-radius:18px;overflow:hidden;border:1px solid #27272a;box-shadow:0 12px 40px rgba(0,0,0,0.6);">
        <div style="height:5px;background:linear-gradient(90deg,#10b981,#34d399,#6366f1)"></div>
        <div style="padding:40px 32px;text-align:center">
          <div style="display:inline-block;padding:8px 18px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);border-radius:50px;color:#34d399;font-weight:700;font-size:12px;margin-bottom:20px;letter-spacing:0.5px">
            EDUHUB O'QUV MARKAZI
          </div>
          <h2 style="font-size:24px;font-weight:800;color:#ffffff;margin:0 0 10px;letter-spacing:-0.5px">
            Sizning Kirish Parolingiz
          </h2>
          <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 26px">
            EduHub platformasida hisobingiz yaratildi. Saytga kirish uchun emailingiz va quyidagi paroldan foydalaning:
          </p>

          <div style="background:#18181b;border:2px dashed #10b981;border-radius:14px;padding:26px 20px;margin-bottom:24px;display:inline-block;min-width:300px">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#71717a;margin-bottom:8px;font-weight:700">Kirish Paroli</div>
            <span style="font-size:38px;font-weight:900;letter-spacing:10px;color:#34d399;font-family:'Courier New',Courier,monospace;padding-left:10px">
              ${password}
            </span>
          </div>

          <div style="background:#141418;border-radius:10px;padding:16px;margin-bottom:24px;text-align:left;font-size:13px;border:1px solid #222">
            <div style="color:#71717a;margin-bottom:4px">📧 <strong>Login:</strong> <span style="color:#fafafa">${toEmail}</span></div>
            <div style="color:#71717a">🔑 <strong>Parol:</strong> <span style="color:#34d399;font-family:monospace;font-weight:bold">${password}</span></div>
          </div>

          <p style="color:#a1a1aa;font-size:13px;margin:0 0 8px">
            🌐 Sayt manzili: <a href="http://localhost:3000" style="color:#34d399;text-decoration:none;font-weight:bold">http://localhost:3000</a>
          </p>
          <p style="color:#52525b;font-size:12px;margin:0">
            Xavfsizlik maqsadida ushbu parolni boshqalarga bermang.
          </p>
        </div>
        <div style="background:#111114;padding:16px;text-align:center;font-size:12px;color:#52525b;border-top:1px solid #1e1e24">
          © 2026 EduHub Platform. Barcha huquqlar himoyalangan.
        </div>
      </div>
    `
  });

  const previewUrl = !isReal ? nodemailer.getTestMessageUrl(info) : null;

  console.log(`📨 Password sent to ${toEmail} | Real: ${isReal} | Password: ${password}`);
  if (previewUrl) {
    console.log(`   Preview link: ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    previewUrl,
    isReal
  };
}

module.exports = { generatePassword, sendPasswordEmail };
