import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: true, // true for port 465
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // This is the key fix for cPanel
    minVersion: "TLSv1.2", // Force TLS version
  },
  socketTimeout: 10000, // Add timeouts
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

export const sendEmail = async (
  to: string,
  subject: string,
  text?: string,
  html?: string
) => {
  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_USERNAME}>`,
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
