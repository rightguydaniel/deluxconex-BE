import { Request, Response } from "express";
import { sendEmail } from "../configs/email/emailConfig";
import sendResponse from "../utils/sendResponse";

const CONTACT_RECIPIENT =
  process.env.CONTACT_RECIPIENT || "admin@deluxconex.com";

const normalizeField = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const submitContactForm = async (request: Request, response: Response) => {
  try {
    const name = normalizeField(request.body?.name);
    const email = normalizeField(request.body?.email);
    const phone = normalizeField(request.body?.phone);
    const company = normalizeField(request.body?.company);
    const zipCode = normalizeField(request.body?.zipCode);
    const message = normalizeField(request.body?.message);

    if (!name || !email || !message) {
      sendResponse(
        response,
        400,
        "Please provide your name, email, and project details.",
        null,
        "Missing required fields"
      );
      return;
    }

    const subject = `New quote request from ${name}`;
    const textBody = [
      "You have a new quote request from the website contact form:",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Company: ${company || "Not provided"}`,
      `Delivery ZIP: ${zipCode || "Not provided"}`,
      "",
      "Project details:",
      message || "No additional details provided.",
    ].join("\n");

    const htmlBody = `
      <p>You have a new quote request from the website contact form:</p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone || "Not provided"}</li>
        <li><strong>Company:</strong> ${company || "Not provided"}</li>
        <li><strong>Delivery ZIP:</strong> ${zipCode || "Not provided"}</li>
      </ul>
      <p><strong>Project details:</strong></p>
      <p>${message || "No additional details provided."}</p>
    `;

    await sendEmail(CONTACT_RECIPIENT, subject, textBody, htmlBody, email);

    sendResponse(response, 200, "Your quote request has been sent. We'll be in touch soon.");
    return;
  } catch (error) {
    console.error("Contact form submission failed:", error);
    sendResponse(
      response,
      500,
      "We couldn't send your request right now. Please try again later.",
      null,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};

export default { submitContactForm };
