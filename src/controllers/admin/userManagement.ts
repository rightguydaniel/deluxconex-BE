import { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  Addresses,
  AddressType,
  AddressesAttributes,
} from "../../models/addresses";
import { Users, UsersRole, UsersAttributes } from "../../models/users";
import { Orders } from "../../models/orders";
import { Carts, CartItem } from "../../models/carts";
import { Invoices } from "../../models/invoices";
import {
  PaymentMethods,
  PaymentMethodAttributes,
} from "../../models/paymentMethods";
import sendResponse from "../../utils/sendResponse";
import { Op, WhereOptions, where, fn, col } from "sequelize";
import { v4 } from "uuid";

const buildUserSearchFilter = (query: string): WhereOptions => {
  const normalized = query.toLowerCase();
  const like = `%${normalized}%`;

  return {
    [Op.or]: [
      where(fn("LOWER", col("full_name")), { [Op.like]: like }),
      where(fn("LOWER", col("email")), { [Op.like]: like }),
      where(fn("LOWER", col("user_name")), { [Op.like]: like }),
      where(fn("LOWER", col("phone")), { [Op.like]: like }),
    ],
  };
};

const sanitizeCartItems = (items: any): CartItem[] => {
  if (Array.isArray(items)) {
    return items;
  }

  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Failed to parse cart items JSON", error);
      return [];
    }
  }

  return [];
};

const recalculateCartTotals = (items: CartItem[]) => {
  const subtotal = items.reduce((sum, item) => {
    const quantity = item.quantity ?? 0;
    const base = item.totalPrice ?? (item.itemPrice || 0) * quantity;
    return sum + base;
  }, 0);
  const shipping = items.reduce(
    (sum, item) => sum + (item.selectedDelivery?.price || 0),
    0
  );
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  return { subtotal, shipping, tax, total };
};

export const listAdminUsers = async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string)?.trim();

    const whereClause: WhereOptions = {};
    if (search) {
      Object.assign(whereClause, buildUserSearchFilter(search));
    }

    const users = await Users.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] },
    });

    sendResponse(res, 200, "Users fetched successfully", users);
  } catch (error: any) {
    sendResponse(res, 500, "Failed to fetch users", null, error.message);
  }
};

export const getAdminUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await Users.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    sendResponse(res, 200, "User retrieved successfully", user);
  } catch (error: any) {
    sendResponse(res, 500, "Failed to retrieve user", null, error.message);
  }
};

export const updateAdminUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { full_name, user_name, email, phone, password, role } = req.body;

    const user = await Users.findByPk(id);
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    if (email && email !== user.email) {
      const existingEmail = await Users.findOne({ where: { email } });
      if (existingEmail && existingEmail.id !== id) {
        return sendResponse(res, 400, "Email already in use");
      }
    }

    if (user_name && user_name !== user.user_name) {
      const existingUsername = await Users.findOne({ where: { user_name } });
      if (existingUsername && existingUsername.id !== id) {
        return sendResponse(res, 400, "Username already in use");
      }
    }

    const updateData: Partial<UsersAttributes> = {
      full_name: full_name ?? user.full_name,
      user_name: user_name ?? user.user_name,
      email: email ?? user.email,
      phone: phone ?? user.phone,
    };

    if (role) {
      if (!Object.values(UsersRole).includes(role)) {
        return sendResponse(res, 400, "Invalid role provided");
      }
      updateData.role = role;
    }

    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    await user.update(updateData);

    const updatedUser = await Users.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    sendResponse(res, 200, "User updated successfully", updatedUser);
  } catch (error: any) {
    sendResponse(res, 500, "Failed to update user", null, error.message);
  }
};

export const updateAdminUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(UsersRole).includes(role)) {
      return sendResponse(res, 400, "Invalid role provided");
    }

    const user = await Users.findByPk(id);
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    await user.update({ role });

    sendResponse(res, 200, "User role updated successfully", {
      id: user.id,
      role: user.role,
    });
  } catch (error: any) {
    sendResponse(res, 500, "Failed to update user role", null, error.message);
  }
};

export const toggleAdminUserBlock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { blocked } = req.body as { blocked?: boolean };

    const user = await Users.findByPk(id);
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    const shouldBlock =
      typeof blocked === "boolean" ? blocked : user.blocked_at ? false : true;
    const blocked_at = shouldBlock ? new Date() : null;

    await user.update({ blocked_at });

    sendResponse(res, 200, "User block status updated", {
      id: user.id,
      blocked_at: user.blocked_at,
    });
  } catch (error: any) {
    sendResponse(res, 500, "Failed to update block status", null, error.message);
  }
};

export const toggleAdminUserDeletion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { deleted } = req.body as { deleted?: boolean };

    const user = await Users.findByPk(id);
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    const shouldDelete =
      typeof deleted === "boolean" ? deleted : user.deleted_at ? false : true;
    const deleted_at = shouldDelete ? new Date() : null;

    await user.update({ deleted_at });

    sendResponse(res, 200, "User deletion status updated", {
      id: user.id,
      deleted_at: user.deleted_at,
    });
  } catch (error: any) {
    sendResponse(res, 500, "Failed to update deletion status", null, error.message);
  }
};

export const getAdminUserOrders = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orders = await Orders.findAll({
      where: { userId: id },
      order: [["createdAt", "DESC"]],
    });

    const formatted = orders.map((order) => {
      const json = order.toJSON() as any;
      json.items = sanitizeCartItems(json.items);
      json.shippingAddress =
        typeof json.shippingAddress === "string"
          ? JSON.parse(json.shippingAddress)
          : json.shippingAddress;
      return json;
    });

    sendResponse(res, 200, "User orders retrieved successfully", formatted);
  } catch (error: any) {
    sendResponse(res, 500, "Failed to retrieve user orders", null, error.message);
  }
};

export const getAdminUserInvoices = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoices = await Invoices.findAll({
      where: { userId: id },
      order: [["issueDate", "DESC"]],
    });

    sendResponse(
      res,
      200,
      "User invoices retrieved successfully",
      invoices
    );
  } catch (error: any) {
    sendResponse(res, 500, "Failed to retrieve user invoices", null, error.message);
  }
};

export const getAdminUserCart = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cart = await Carts.findOne({ where: { userId: id } });

    if (!cart) {
      return sendResponse(res, 200, "Cart retrieved successfully", {
        items: [],
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
      });
    }

    const items = sanitizeCartItems(cart.get("items"));

    sendResponse(res, 200, "Cart retrieved successfully", {
      items,
      subtotal: cart.get("subtotal"),
      shipping: cart.get("shipping"),
      tax: cart.get("tax"),
      total: cart.get("total"),
    });
  } catch (error: any) {
    sendResponse(res, 500, "Failed to retrieve user cart", null, error.message);
  }
};

export const updateAdminUserCartItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      productId,
      selectedDimension,
      selectedCondition,
      selectedDelivery,
      quantity,
    } = req.body as Partial<CartItem> & { quantity: number };

    if (!productId || typeof quantity !== "number") {
      return sendResponse(res, 400, "Invalid cart item payload");
    }

    const cart = await Carts.findOne({ where: { userId: id } });
    if (!cart) {
      return sendResponse(res, 404, "Cart not found");
    }

    const items = sanitizeCartItems(cart.get("items"));

    const index = items.findIndex((item) =>
      item.productId === productId &&
      item.selectedDimension?.dimension === selectedDimension?.dimension &&
      item.selectedCondition?.condition === selectedCondition?.condition &&
      item.selectedDelivery?.method === selectedDelivery?.method
    );

    if (index === -1) {
      return sendResponse(res, 404, "Item not found in cart");
    }

    items[index] = {
      ...items[index],
      quantity,
      totalPrice: (items[index].itemPrice || 0) * quantity,
    };

    const totals = recalculateCartTotals(items);

    await cart.update({
      items,
      ...totals,
      updatedAt: new Date(),
    });

    sendResponse(res, 200, "Cart item updated successfully", {
      items,
      ...totals,
    });
  } catch (error: any) {
    sendResponse(res, 500, "Failed to update cart item", null, error.message);
  }
};

export const removeAdminUserCartItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { item } = req.body as { item?: CartItem };

    if (!item) {
      return sendResponse(res, 400, "Cart item descriptor is required");
    }

    const cart = await Carts.findOne({ where: { userId: id } });
    if (!cart) {
      return sendResponse(res, 404, "Cart not found");
    }

    const items = sanitizeCartItems(cart.get("items")).filter(
      (existing) =>
        !(
          existing.productId === item.productId &&
          existing.selectedDimension?.dimension ===
            item.selectedDimension?.dimension &&
          existing.selectedCondition?.condition ===
            item.selectedCondition?.condition &&
          existing.selectedDelivery?.method === item.selectedDelivery?.method
        )
    );

    const totals = recalculateCartTotals(items);

    await cart.update({
      items,
      ...totals,
      updatedAt: new Date(),
    });

    sendResponse(res, 200, "Cart item removed successfully", {
      items,
      ...totals,
    });
  } catch (error: any) {
    sendResponse(res, 500, "Failed to remove cart item", null, error.message);
  }
};

export const clearAdminUserCart = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cart = await Carts.findOne({ where: { userId: id } });
    if (!cart) {
      return sendResponse(res, 404, "Cart not found");
    }

    await cart.update({
      items: [],
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      updatedAt: new Date(),
    });

    sendResponse(res, 200, "Cart cleared successfully", {
      items: [],
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
    });
  } catch (error: any) {
    sendResponse(res, 500, "Failed to clear cart", null, error.message);
  }
};

export const getAdminUserAddresses = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const addresses = await Addresses.findAll({ where: { userId: id } });

    sendResponse(
      res,
      200,
      "User addresses retrieved successfully",
      addresses
    );
  } catch (error: any) {
    sendResponse(res, 500, "Failed to retrieve addresses", null, error.message);
  }
};

export const createAdminUserAddress = async (req: Request, res: Response) => {
  try {
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
    } = req.body as Partial<AddressesAttributes>;

    if (!type || !Object.values(AddressType).includes(type)) {
      return sendResponse(res, 400, "Invalid address type");
    }

    if (!street || !city || !state || !postalCode || !country) {
      return sendResponse(res, 400, "Missing required address fields");
    }

    if (isDefault) {
      await Addresses.update({ isDefault: false }, { where: { userId: id } });
    }

    const address = await Addresses.create({
      id: v4(),
      userId: id,
      type,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault: !!isDefault,
      phone,
      additionalInfo,
    });

    sendResponse(res, 201, "Address created successfully", address);
  } catch (error: any) {
    sendResponse(res, 500, "Failed to create address", null, error.message);
  }
};

export const updateAdminUserAddress = async (req: Request, res: Response) => {
  try {
    const { id, addressId } = req.params;
    const payload = req.body as Partial<AddressesAttributes>;

    const address = await Addresses.findOne({
      where: { id: addressId, userId: id },
    });

    if (!address) {
      return sendResponse(res, 404, "Address not found");
    }

    if (payload.type && !Object.values(AddressType).includes(payload.type)) {
      return sendResponse(res, 400, "Invalid address type");
    }

    if (payload.isDefault) {
      await Addresses.update({ isDefault: false }, { where: { userId: id } });
    }

    await address.update(payload);

    sendResponse(res, 200, "Address updated successfully", address);
  } catch (error: any) {
    sendResponse(res, 500, "Failed to update address", null, error.message);
  }
};

export const deleteAdminUserAddress = async (req: Request, res: Response) => {
  try {
    const { id, addressId } = req.params;

    const address = await Addresses.findOne({
      where: { id: addressId, userId: id },
    });

    if (!address) {
      return sendResponse(res, 404, "Address not found");
    }

    await address.destroy();

    sendResponse(res, 200, "Address deleted successfully");
  } catch (error: any) {
    sendResponse(res, 500, "Failed to delete address", null, error.message);
  }
};

export const setAdminUserDefaultAddress = async (req: Request, res: Response) => {
  try {
    const { id, addressId } = req.params;

    const address = await Addresses.findOne({
      where: { id: addressId, userId: id },
    });

    if (!address) {
      return sendResponse(res, 404, "Address not found");
    }

    await Addresses.update({ isDefault: false }, { where: { userId: id } });
    await address.update({ isDefault: true });

    sendResponse(res, 200, "Default address updated successfully", address);
  } catch (error: any) {
    sendResponse(res, 500, "Failed to update default address", null, error.message);
  }
};

export const getAdminUserPaymentMethods = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const methods = await PaymentMethods.findAll({
      where: { userId: id, deletedAt: null },
      order: [
        ["isDefault", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    const sanitized = methods.map((method) => {
      const json = method.toJSON() as any;
      delete json.cardNumber;
      delete json.cvv;
      return json;
    });

    sendResponse(
      res,
      200,
      "Payment methods retrieved successfully",
      sanitized
    );
  } catch (error: any) {
    sendResponse(res, 500, "Failed to retrieve payment methods", null, error.message);
  }
};

export const updateAdminUserPaymentMethod = async (req: Request, res: Response) => {
  try {
    const { id, paymentMethodId } = req.params;
    const payload = req.body as Partial<PaymentMethodAttributes>;

    const method = await PaymentMethods.findOne({
      where: { id: paymentMethodId, userId: id, deletedAt: null },
    });

    if (!method) {
      return sendResponse(res, 404, "Payment method not found");
    }

    if (payload.isDefault) {
      await PaymentMethods.update(
        { isDefault: false },
        { where: { userId: id, deletedAt: null } }
      );
    }

    await method.update({
      cardholderName:
        payload.cardholderName ?? (method.get("cardholderName") as string),
      expiryMonth:
        payload.expiryMonth ?? (method.get("expiryMonth") as number),
      expiryYear:
        payload.expiryYear ?? (method.get("expiryYear") as number),
      billingAddress:
        payload.billingAddress ??
        (method.get("billingAddress") as PaymentMethodAttributes["billingAddress"]),
      isDefault:
        payload.isDefault ?? (method.get("isDefault") as boolean),
    });

    const sanitized = method.toJSON() as any;
    delete sanitized.cardNumber;
    delete sanitized.cvv;

    sendResponse(res, 200, "Payment method updated successfully", sanitized);
  } catch (error: any) {
    sendResponse(res, 500, "Failed to update payment method", null, error.message);
  }
};

export const setAdminUserDefaultPaymentMethod = async (
  req: Request,
  res: Response
) => {
  try {
    const { id, paymentMethodId } = req.params;

    const method = await PaymentMethods.findOne({
      where: { id: paymentMethodId, userId: id, deletedAt: null },
    });

    if (!method) {
      return sendResponse(res, 404, "Payment method not found");
    }

    await PaymentMethods.update(
      { isDefault: false },
      { where: { userId: id, deletedAt: null } }
    );
    await method.update({ isDefault: true });

    const sanitized = method.toJSON() as any;
    delete sanitized.cardNumber;
    delete sanitized.cvv;

    sendResponse(res, 200, "Default payment method updated", sanitized);
  } catch (error: any) {
    sendResponse(res, 500, "Failed to set default payment method", null, error.message);
  }
};

export const deleteAdminUserPaymentMethod = async (
  req: Request,
  res: Response
) => {
  try {
    const { id, paymentMethodId } = req.params;

    const method = await PaymentMethods.findOne({
      where: { id: paymentMethodId, userId: id, deletedAt: null },
    });

    if (!method) {
      return sendResponse(res, 404, "Payment method not found");
    }

    await method.update({ deletedAt: new Date(), isDefault: false });

    sendResponse(res, 200, "Payment method deleted successfully");
  } catch (error: any) {
    sendResponse(res, 500, "Failed to delete payment method", null, error.message);
  }
};
