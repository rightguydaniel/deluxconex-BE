import { Response } from "express";
import { Carts, CartItem } from "../models/carts";
import { Users } from "../models/users";
import sendResponse from "../utils/sendResponse";
import { JwtPayload } from "jsonwebtoken";
import { v4 } from "uuid";

export const getCart = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;

    // Find the user's cart
    const cart: any = await Carts.findOne({ where: { userId } });

    if (!cart) {
      // Return an empty cart if none exists
      return sendResponse(res, 200, "Cart retrieved successfully", {
        items: [],
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
      });
    }

    // Parse items if they're stored as string
    const items =
      typeof cart.items === "string" ? JSON.parse(cart.items) : cart.items;

    sendResponse(res, 200, "Cart retrieved successfully", {
      items,
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      tax: cart.tax,
      total: cart.total,
    });
  } catch (error: any) {
    console.error("Error retrieving cart:", error);
    sendResponse(res, 500, "Error retrieving cart", null, error.message);
  }
};

export const addToCart = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const item: CartItem = req.body;

    // Validate required fields
    if (
      !item.productId ||
      !item.name ||
      !item.basePrice ||
      !item.quantity ||
      !item.itemPrice ||
      !item.totalPrice
    ) {
      return sendResponse(res, 400, "Missing required item fields", null);
    }

    let cart: any = await Carts.findOne({ where: { userId } });

    if (!cart) {
      // Create new cart
      cart = await Carts.create({
        id: v4(),
        userId,
        items: [item],
        subtotal: item.totalPrice,
        shipping: item.selectedDelivery?.price || 0,
        tax: item.totalPrice * 0.01,
        total:
          item.totalPrice +
          (item.selectedDelivery?.price || 0) +
          item.totalPrice * 0.01,
      });

      return sendResponse(res, 200, "Item added to cart successfully", {
        items: [item],
        subtotal: item.totalPrice,
        shipping: item.selectedDelivery?.price || 0,
        tax: item.totalPrice * 0.01,
        total:
          item.totalPrice +
          (item.selectedDelivery?.price || 0) +
          item.totalPrice * 0.01,
      });
    }

    // Parse items from JSON string to array
    const currentItems: CartItem[] =
      typeof cart.items === "string" ? JSON.parse(cart.items) : cart.items;

    // Check if item already exists with the same configuration
    const existingItemIndex = currentItems.findIndex(
      (i: CartItem) =>
        i.productId === item.productId &&
        i.selectedDimension?.dimension === item.selectedDimension?.dimension &&
        i.selectedCondition?.condition === item.selectedCondition?.condition &&
        i.selectedDelivery?.method === item.selectedDelivery?.method
    );

    let updatedItems: CartItem[];
    if (existingItemIndex > -1) {
      // Update existing item quantity
      updatedItems = [...currentItems];
      const existingItem = updatedItems[existingItemIndex];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + item.quantity,
        totalPrice:
          existingItem.itemPrice * (existingItem.quantity + item.quantity),
      };
    } else {
      // Add new item
      updatedItems = [...currentItems, item];
    }

    // Recalculate cart totals
    const subtotal = updatedItems.reduce(
      (sum: number, item) => sum + item.totalPrice,
      0
    );
    const shipping = updatedItems.reduce(
      (sum: number, item) => sum + (item.selectedDelivery?.price || 0),
      0
    );
    const tax = subtotal * 0.01;
    const total = subtotal + shipping + tax;

    // Update the cart in database
    await Carts.update(
      {
        items: updatedItems,
        subtotal,
        shipping,
        tax,
        total,
        updatedAt: new Date(),
      },
      { where: { userId } }
    );

    // Return the updated cart
    sendResponse(res, 200, "Item added to cart successfully", {
      items: updatedItems,
      subtotal,
      shipping,
      tax,
      total,
    });
  } catch (error: any) {
    console.error("Error adding to cart:", error);
    sendResponse(res, 500, "Error adding to cart", null, error.message);
  }
};

export const updateCartItem = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const updatedItem: CartItem = req.body;

    const cart: any = await Carts.findOne({ where: { userId } });
    if (!cart) {
      return sendResponse(res, 404, "Cart not found", null);
    }

    // Parse items from JSON string to array
    const currentItems: CartItem[] =
      typeof cart.items === "string" ? JSON.parse(cart.items) : cart.items;

    // Find the item index with ALL the same configuration
    const itemIndex = currentItems.findIndex(
      (item: CartItem) =>
        item.productId === updatedItem.productId &&
        item.selectedDimension?.dimension ===
          updatedItem.selectedDimension?.dimension &&
        item.selectedCondition?.condition ===
          updatedItem.selectedCondition?.condition &&
        item.selectedDelivery?.method === updatedItem.selectedDelivery?.method
    );

    if (itemIndex === -1) {
      return sendResponse(res, 404, "Item not found in cart", null);
    }

    // Update the item
    currentItems[itemIndex] = {
      ...currentItems[itemIndex],
      quantity: updatedItem.quantity,
      totalPrice: currentItems[itemIndex].itemPrice * updatedItem.quantity,
    };

    // Recalculate totals
    const subtotal = currentItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    const shipping = currentItems.reduce(
      (sum, item) => sum + (item.selectedDelivery?.price || 0),
      0
    );
    const tax = subtotal * 0.01;
    const total = subtotal + shipping + tax;

    // Update the cart in database
    await Carts.update(
      {
        items: currentItems,
        subtotal,
        shipping,
        tax,
        total,
        updatedAt: new Date(),
      },
      { where: { userId } }
    );

    // Return the updated cart
    sendResponse(res, 200, "Item updated successfully", {
      items: currentItems,
      subtotal,
      shipping,
      tax,
      total,
    });
  } catch (error: any) {
    console.error("Error updating cart item:", error);
    sendResponse(res, 500, "Error updating cart item", null, error.message);
  }
};

export const removeFromCart = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;

    // We need to get the full item data from the request body to match the exact configuration
    const itemToRemove = req.body.itemToRemove;

    const cart: any = await Carts.findOne({ where: { userId } });
    if (!cart) {
      return sendResponse(res, 404, "Cart not found", null);
    }

    // Parse items from JSON string to array
    const currentItems: CartItem[] =
      typeof cart.items === "string" ? JSON.parse(cart.items) : cart.items;

    // Filter out the exact item (matching all configurations)
    const filteredItems = currentItems.filter(
      (item: CartItem) =>
        !(
          item.productId === productId &&
          item.selectedDimension?.dimension ===
            itemToRemove.selectedDimension?.dimension &&
          item.selectedCondition?.condition ===
            itemToRemove.selectedCondition?.condition &&
          item.selectedDelivery?.method ===
            itemToRemove.selectedDelivery?.method
        )
    );

    // Recalculate totals
    const subtotal = filteredItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    const shipping = filteredItems.reduce(
      (sum, item) => sum + (item.selectedDelivery?.price || 0),
      0
    );
    const tax = subtotal * 0.01;
    const total = subtotal + shipping + tax;

    // Update the cart in database
    await Carts.update(
      {
        items: filteredItems,
        subtotal,
        shipping,
        tax,
        total,
        updatedAt: new Date(),
      },
      { where: { userId } }
    );

    // Return the updated cart
    sendResponse(res, 200, "Item removed successfully", {
      items: filteredItems,
      subtotal,
      shipping,
      tax,
      total,
    });
  } catch (error: any) {
    console.error("Error removing cart item:", error);
    sendResponse(res, 500, "Error removing cart item", null, error.message);
  }
};

export const clearCart = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const cart = await Carts.findOne({ where: { userId } });

    if (!cart) {
      return sendResponse(res, 404, "Cart not found");
    }

    await cart.update({
      items: [],
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
    });

    sendResponse(res, 200, "Cart cleared successfully", cart);
  } catch (error: any) {
    sendResponse(res, 500, "Error clearing cart", null, error.message);
  }
};
