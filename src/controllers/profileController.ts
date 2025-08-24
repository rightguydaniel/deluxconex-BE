import { Request, Response } from "express";
import { Users } from "../models/users";
import sendResponse from "../utils/sendResponse";
import bcrypt from "bcrypt";
import { JwtPayload } from "jsonwebtoken";

export const getProfile = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await Users.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    sendResponse(res, 200, "Profile retrieved successfully", user);
  } catch (error: any) {
    sendResponse(res, 500, "Error retrieving profile", null, error.message);
  }
};

export const updateProfile = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const { full_name, user_name, email, phone, password } = req.body;

    const user = await Users.findByPk(userId);
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await Users.findOne({ where: { email } });
      if (existingUser) {
        return sendResponse(res, 400, "Email already in use");
      }
    }

    // Check if username is already taken by another user
    if (user_name && user_name !== user.user_name) {
      const existingUser = await Users.findOne({ where: { user_name } });
      if (existingUser) {
        return sendResponse(res, 400, "Username already in use");
      }
    }

    const updateData: any = { full_name, user_name, email, phone };

    // Hash password if provided
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    await user.update(updateData);

    // Return user without password
    const updatedUser = await Users.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    sendResponse(res, 200, "Profile updated successfully", updatedUser);
  } catch (error: any) {
    sendResponse(res, 500, "Error updating profile", null, error.message);
  }
};