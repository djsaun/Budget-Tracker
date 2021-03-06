const nodemailer = require('nodemailer'); // Interfaces with SMTP
const pug = require('pug');
const juice = require('juice'); // creates inline css
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API);

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
  const inlinedCSS = juice(html);
  return inlinedCSS;
}

exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);

  const mailOptions = {
    from: `David Saunders <djsaun@gmail.com>`,
    to: options.user.email,
    subject: options.subject,
    html,
    text
  };

  return sgMail.send(mailOptions);
}