require('dotenv').config();
const nodemailer = require("nodemailer");
const fs = require("fs");
const mustache = require('mustache');

const MAILER_NAME = process.env.MAILER_NAME;
const GMAIL_APP_EMAIL = process.env.GMAIL_APP_EMAIL;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const GMAIL_APP_TEST_RECEIVER = process.env.GMAIL_APP_TEST_RECEIVER;

const templateHtml = fs.readFileSync(require.resolve('./validate-email-template.html'), 'utf8');

const sendEmail = async ({ name = 'User', email: receiverEmail = GMAIL_APP_TEST_RECEIVER }) => {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_APP_EMAIL,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  const htmlContent = mustache.render(templateHtml, {
    name,
    email: receiverEmail
  });

  let info = await transporter.sendMail({
    from: MAILER_NAME,
    to: receiverEmail,
    subject: "Verify email address",
    html: htmlContent,
  });

  console.log("Message sent: %s", info.messageId);
}

module.exports = sendEmail;