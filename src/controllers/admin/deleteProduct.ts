import { Response } from "express";
import Products from "../../models/products";
import { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import path from "path";

export const deleteProduct = async (req: JwtPayload, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Product ID is required",
      });
    }

    // Find the product first
    const product = await Products.findByPk(id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Delete associated images from filesystem
    try {
      // Delete product images
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((imagePath: string) => {
          if (imagePath.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), 'public', imagePath);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        });
      }

      // Delete condition images
      if (product.dimensions && Array.isArray(product.dimensions)) {
        product.dimensions.forEach((dimension: any) => {
          if (dimension.conditions && Array.isArray(dimension.conditions)) {
            dimension.conditions.forEach((condition: any) => {
              if (condition.images && Array.isArray(condition.images)) {
                condition.images.forEach((imagePath: string) => {
                  if (imagePath.startsWith('/uploads/')) {
                    const filePath = path.join(process.cwd(), 'public', imagePath);
                    if (fs.existsSync(filePath)) {
                      fs.unlinkSync(filePath);
                    }
                  }
                });
              }
            });
          }
        });
      }
    } catch (fileError) {
      console.warn("Error deleting product files:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await product.destroy();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("Product deletion error:", error);
    return res.status(500).json({
      message: "Failed to delete product",
      error: error.message,
    });
  }
};