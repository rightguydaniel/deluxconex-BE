import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "deluxconex.com",
  port: 465,
  auth: {
    user: "no-reply@deluxconex.com",
    pass: "JM$F2Me-yeXv",
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  text?: string,
  html?: string,
  replyTo?: string
) => {
  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_USERNAME}>`,
    to,
    subject,
    text: text || "",
    html: html || text || "",
    ...(replyTo ? { replyTo } : {}),
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
