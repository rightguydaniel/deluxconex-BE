import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "deluxconex.com",
  port: Number(process.env.MAIL_PORT) || 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.MAIL_USERNAME || "no-reply@deluxconex.com",
    pass: process.env.MAIL_PASSWORD || "JM$F2Me-yeXv",
  },
  tls: {
    rejectUnauthorized: false, // ← THIS IS THE CRITICAL FIX
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  text?: string,
  html?: string
) => {
  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME || "DeluxConex"}" <${process.env.MAIL_USERNAME || "no-reply@deluxconex.com"}>`,
    to,
    subject,
    text: text || "",
    html: html || text || "",
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
