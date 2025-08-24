import { Response } from "express";
import Products from "../../models/products";
import { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import path from "path";

export const editProduct = async (req: JwtPayload, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Product ID is required",
      });
    }

    if (!req.body.productData) {
      return res.status(400).json({
        message: "Missing product data",
      });
    }

    let productData;
    if (typeof req.body.productData === "object") {
      productData = req.body.productData;
    } else if (typeof req.body.productData === "string") {
      try {
        productData = JSON.parse(req.body.productData);
      } catch (parseError) {
        return res.status(400).json({
          message: "Invalid product data format",
          error: (parseError as Error).message,
        });
      }
    } else {
      return res.status(400).json({
        message: "Invalid product data type",
      });
    }

    // Handle file uploads
    const productImagePaths: string[] = [];
    const conditionImageMap: { [key: string]: string[] } = {};

    // Process uploaded files
    if (req.files && Array.isArray(req.files)) {
      const files = req.files as Express.Multer.File[];

      // Process product images
      const productImages = files.filter(
        (file) => file.fieldname === "productImages"
      );
      if (productImages.length > 0) {
        const uploadDir = path.join(
          process.cwd(),
          "public",
          "uploads",
          "products"
        );
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (const file of productImages) {
          const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
          const filePath = path.join(uploadDir, fileName);
          const webPath = `/uploads/products/${fileName}`;

          fs.writeFileSync(filePath, file.buffer);
          productImagePaths.push(webPath);
        }
      }

      // Process condition images
      const conditionImages = files.filter((file) =>
        file.fieldname.startsWith("conditionImages_")
      );
      if (conditionImages.length > 0) {
        const uploadDir = path.join(
          process.cwd(),
          "public",
          "uploads",
          "products",
          "conditions"
        );
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (const file of conditionImages) {
          const [_, dimensionIndex, conditionIndex] = file.fieldname.split("_");
          const fileName = `condition_${dimensionIndex}_${conditionIndex}_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
          const filePath = path.join(uploadDir, fileName);
          const webPath = `/uploads/products/conditions/${fileName}`;

          fs.writeFileSync(filePath, file.buffer);

          const key = `${dimensionIndex}_${conditionIndex}`;
          if (!conditionImageMap[key]) {
            conditionImageMap[key] = [];
          }
          conditionImageMap[key].push(webPath);
        }
      }
    }

    // Find existing product
    const existingProduct = await Products.findByPk(id);
    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Prepare update data
    const updateData: any = {
      ...productData,
    };

    // Only update images if new ones were uploaded
    if (productImagePaths.length > 0) {
      updateData.images = productImagePaths;
    }

    // Update condition images
    if (updateData.dimensions && Array.isArray(updateData.dimensions)) {
      updateData.dimensions = updateData.dimensions.map(
        (dimension: any, dimIndex: number) => {
          if (dimension.conditions && Array.isArray(dimension.conditions)) {
            dimension.conditions = dimension.conditions.map(
              (condition: any, condIndex: number) => {
                const key = `${dimIndex}_${condIndex}`;
                if (
                  conditionImageMap[key] &&
                  conditionImageMap[key].length > 0
                ) {
                  return {
                    ...condition,
                    images: conditionImageMap[key],
                  };
                }
                return condition;
              }
            );
          }
          return dimension;
        }
      );
    }

    // Update product
    const updatedProduct = await existingProduct.update(updateData);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error: any) {
    console.error("Product update error:", error);
    return res.status(500).json({
      message: "Failed to update product",
      error: error.message,
    });
  }
};