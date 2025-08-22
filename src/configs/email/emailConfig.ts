import nodemailer from "nodemailer";

// cPanel-specific environment variable handling
const getEnv = (key: string, defaultValue?: string): string => {
  if (process.env[key]) return process.env[key] as string;

  const fallbacks: { [key: string]: string } = {
    MAIL_HOST: "deluxconex.com",
    MAIL_PORT: "465",
    MAIL_USERNAME: "no-reply@deluxconex.com",
    MAIL_PASSWORD: "JM$F2Me-yeXv",
    MAIL_FROM_NAME: "DeluxConex",
  };

  return defaultValue || fallbacks[key] || "";
};

const transporter = nodemailer.createTransport({
  host: getEnv("MAIL_HOST"),
  port: Number(getEnv("MAIL_PORT")),
  secure: true,
  auth: {
    user: getEnv("MAIL_USERNAME"),
    pass: getEnv("MAIL_PASSWORD"),
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  text?: string,
  html?: string
) => {
  const mailOptions = {
    from: `"${getEnv("MAIL_FROM_NAME")}" <${getEnv("MAIL_USERNAME")}>`,
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
