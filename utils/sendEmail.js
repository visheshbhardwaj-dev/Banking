const nodemailer = require("nodemailer");
require("dotenv").config();


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});  


const sendEmail = async (to,subject,text,html)=>{
    try{
        const info = await transporter.sendMail({
            from: '"tyerbanks" <tyerbanks58@gmail.com>',
            to,
            subject,
            text,
            html
        })
           console.log("Email sent:", info.messageId);
    }catch(error){
        console.log("Error sending email:", error);
    }
}

module.exports  = sendEmail