import { Request, Response } from "express";
import Users, { UsersRole } from "../../models/users";
import { sendEmail } from "../../configs/email/emailConfig";
import sendResponse from "../../utils/sendResponse";

export const register = async (request: Request, response: Response) => {
  try {
    const { full_name, user_name, email, phone, password } = request.body;

    // Check if user already exists
    const existingUser = await Users.findOne({ where: { email } });
    if (existingUser) {
      sendResponse(response, 400, "Email already in use");
      return;
    }
    // Send welcome email
    await sendEmail(
      email,
      "Welcome to Delux",
      `Hi ${full_name}, welcome to DeluxConex`,
      `<h1>Welcome ${full_name}</h1><p>Your account has been successfully created.</p>`
    );

    // Create user
    const user = await Users.create({
      full_name,
      user_name,
      email:email.toLowerCase(),
      phone,
      password,
      role: UsersRole.USER,
    });

    sendResponse(response, 200, "User created successfully");
    return;
  } catch (error: any) {
    console.error("Registration error:", error.message);
    sendResponse(response, 500, "Internal server error", error.message);
    return;
  }
};
