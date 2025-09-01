import { Request, Response } from "express";
import { Addresses, AddressType } from "../models/addresses";
import { Users } from "../models/users";
import sendResponse from "../utils/sendResponse";
import { JwtPayload } from "jsonwebtoken";
import { v4 } from "uuid";

export const getAddresses = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const addresses = await Addresses.findAll({ where: { userId } });
    sendResponse(res, 200, "Addresses retrieved successfully", addresses);
  } catch (error: any) {
    sendResponse(res, 500, "Error retrieving addresses", null, error.message);
  }
};

export const createAddress = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const {
      type,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault,
      phone,
      additionalInfo,
    } = req.body;

    if (isDefault) {
      // Remove default from other addresses
      await Addresses.update(
        { isDefault: false },
        { where: { userId, isDefault: true } }
      );
    }

    const address = await Addresses.create({
      id: v4(),
      userId,
      type,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault,
      phone,
      additionalInfo,
    });

    sendResponse(res, 200, "Address created successfully", address);
    return;
  } catch (error: any) {
    sendResponse(res, 500, "Error creating address", null, error.message);
    return;
  }
};

export const updateAddress = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      type,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault,
      phone,
      additionalInfo,
    } = req.body;

    const address = await Addresses.findOne({ where: { id, userId } });
    if (!address) {
      return sendResponse(res, 400, "Address not found");
    }

    if (isDefault) {
      // Remove default from other addresses
      await Addresses.update(
        { isDefault: false },
        { where: { userId, isDefault: true } }
      );
    }

    await address.update({
      type,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault,
      phone,
      additionalInfo,
    });

    sendResponse(res, 200, "Address updated successfully", address);
  } catch (error: any) {
    sendResponse(res, 500, "Error updating address", null, error.message);
  }
};

export const deleteAddress = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const address = await Addresses.findOne({ where: { id, userId } });
    if (!address) {
      return sendResponse(res, 404, "Address not found");
    }

    await address.destroy();
    sendResponse(res, 200, "Address deleted successfully");
  } catch (error: any) {
    sendResponse(res, 500, "Error deleting address", null, error.message);
  }
};

export const setDefaultAddress = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Remove default from all addresses
    await Addresses.update({ isDefault: false }, { where: { userId } });

    // Set new default
    const address = await Addresses.findOne({ where: { id, userId } });
    if (!address) {
      return sendResponse(res, 404, "Address not found");
    }

    await address.update({ isDefault: true });
    sendResponse(res, 200, "Default address set successfully", address);
  } catch (error: any) {
    sendResponse(
      res,
      500,
      "Error setting default address",
      null,
      error.message
    );
  }
};
