const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendVotingLink = async (email, link) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Online Voting System" <noreply@voting.com>',
      to: email,
      subject: 'Your Unique Voting Link',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; color: #1e293b;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #6366f1; width: 60px; height: 60px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 30px; line-height: 60px;">🗳️</div>
          </div>
          <h2 style="color: #0f172a; margin-bottom: 20px; text-align: center;">Official Voting Invitation</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Hello,</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">You have been registered as an eligible voter in the upcoming election. To ensure the integrity of the vote, you have been assigned a <strong>unique and secure access token</strong>.</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${link}" style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 14px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);">Access Secure Ballot</a>
          </div>
          
          <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 10px; text-align: center;"><strong>Security Warning:</strong> Do not forward this email or share the link above. It is unique to your account and can only be used to vote once.</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; text-align: center;">
            <p>If the button above does not work, copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; color: #6366f1;">${link}</p>
          </div>
          
          <p style="margin-top: 40px; font-size: 14px; text-align: center;">Thank you for participating in our democratic process.</p>
        </div>
      `,
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email: ', error);
    return false;
  }
};

module.exports = { sendVotingLink };
