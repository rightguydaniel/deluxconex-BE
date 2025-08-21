import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Users from "../../models/users";
import { generateToken } from "../../utils/token";
import sendResponse from "../../utils/sendResponse";

export const login = async (request: Request, response: Response) => {
  try {
    const { email, password } = request.body;

    // Find user by email
    const user = await Users.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      sendResponse(response, 400, "Invalid credentials");
      return;
    }

    // Check if user is blocked
    if (user.blocked_at) {
      sendResponse(response, 400, "Account is blocked");
      return;
    }

    if (password !== user.password) {
      sendResponse(response, 400, "Invalid credentials");
      return;
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    sendResponse(response, 200, "Login successful", {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
      token,
    });
    return;
  } catch (error: any) {
    console.error("Login error:", error.message);
    sendResponse(response, 500, "Internal server error", error.message);
    return;
  }
};
