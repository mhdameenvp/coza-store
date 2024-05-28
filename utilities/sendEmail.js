const nodemailer = require('nodemailer');
const OTPModel = require("../models/otpModel")
const bcrypt = require('bcrypt');
require('dotenv').config()

let transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.NODE_MAILER_EMAIL,
    pass: process.env.NODE_MAILER_PASS,
  }
});

let mailsender = async (email, id, htmlContent) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`
    console.log(otp);
    console.log("iam the otp generator");
    const mailoption = {
      from: process.env.NODE_MAILER_EMAIL,
      to: email,
      subject: "OTP VERIFICATION",
      html: `${htmlContent}
            
            <h1>${otp}</h1>`
    }
    const hashedOtp = await bcrypt.hash(otp, 10)
    await transporter.sendMail(mailoption)
    const newOtp = new OTPModel({
      userid: id,
      email: email,
      otp: hashedOtp
    })

    newOtp.save()

    console.log("email send successfully");


  } catch (error) {
    console.log('Error sending email:', error);
  }
}

module.exports = {
  mailsender
}