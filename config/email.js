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
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hello,</h2>
          <p>You have been registered to vote in the upcoming election.</p>
          <p>Please click the secure link below to access your ballot. <strong>Do not share this link with anyone else.</strong></p>
          <div style="margin: 30px 0;">
            <a href="\${link}" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-decoration: none; border-radius: 4px; display: inline-block;">Access Ballot</a>
          </div>
          <p>If the button doesn't work, copy and paste this URL into your browser:</p>
          <p><a href="\${link}">\${link}</a></p>
          <p>Thank you.</p>
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
