import { Response } from "express";
import Products from "../../models/products";
import { JwtPayload } from "jsonwebtoken";
import { Op } from "sequelize";
import sequelize from "sequelize";

interface GetProductsQuery {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  size?: string;
  sort?: string;
}

export const getProducts = async (req: JwtPayload, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      search,
      category,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "DESC",
      size,
      sort,
    } = req.query as GetProductsQuery;

    const andConditions: any[] = [];

    // Search filter (name or SKU)
    if (search) {
      andConditions.push({
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { sku: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ],
      });
    }

    // Size filter (match size text within the product name)
    if (size) {
      const normalizedSize = size.toLowerCase();
      andConditions.push(
        sequelize.where(
          sequelize.fn("LOWER", sequelize.col("name")),
          {
            [Op.like]: `%${normalizedSize}%`,
          }
        )
      );
    }

    // Category filter
    if (category) {
      const dialect = "mysql";

      if (dialect === "mysql" || dialect === "mariadb") {
        andConditions.push(
          sequelize.where(
            sequelize.fn(
              "JSON_CONTAINS",
              sequelize.col("categories"),
              JSON.stringify(category)
            ),
            1
          )
        );
      } else {
        andConditions.push({
          categories: {
            [Op.contains]: [category],
          },
        });
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      const priceConditions: any = {};
      if (minPrice) {
        priceConditions[Op.gte] = parseFloat(minPrice);
      }
      if (maxPrice) {
        priceConditions[Op.lte] = parseFloat(maxPrice);
      }
      andConditions.push({ price: priceConditions });
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Valid sort fields
    const validSortFields = ["name", "price", "createdAt", "updatedAt", "sku"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";

    // Determine sorting based on `sort` shortcut values
    let order: [string, "ASC" | "DESC"][] = [[sortField, sortOrder]];

    if (sort) {
      switch (sort) {
        case "price_asc":
          order = [["price", "ASC"]];
          break;
        case "price_desc":
          order = [["price", "DESC"]];
          break;
        case "oldest":
          order = [["createdAt", "ASC"]];
          break;
        case "newest":
          order = [["createdAt", "DESC"]];
          break;
        default:
          break;
      }
    }

    const whereClause = andConditions.length ? { [Op.and]: andConditions } : undefined;

    // Get products with pagination and filtering
    const { count, rows: products } = await Products.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset: offset,
      order,
    });

    // Parse JSON strings to objects for each product
    const parsedProducts = products.map((product) => ({
      ...product.toJSON(),
      specifications:
        typeof product.specifications === "string"
          ? JSON.parse(product.specifications)
          : product.specifications,
      images:
        typeof product.images === "string"
          ? JSON.parse(product.images)
          : product.images,
      categories:
        typeof product.categories === "string"
          ? JSON.parse(product.categories)
          : product.categories,
      colors:
        typeof (product as any).colors === "string"
          ? JSON.parse((product as any).colors as any)
          : (product as any).colors,
      dimensions:
        typeof product.dimensions === "string"
          ? JSON.parse(product.dimensions)
          : product.dimensions,
      delivery:
        typeof product.delivery === "string"
          ? JSON.parse(product.delivery)
          : product.delivery,
    }));

    // Calculate total pages
    const totalPages = Math.ceil(count / limitNum);

    return res.status(200).json({
      success: true,
      data: {
        products: parsedProducts,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalProducts: count,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error: any) {
    console.error("Get products error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

export const getProductById = async (req: JwtPayload, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await Products.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Parse JSON strings to objects
    const parsedProduct = {
      ...product.toJSON(),
      specifications:
        typeof product.specifications === "string"
          ? JSON.parse(product.specifications)
          : product.specifications,
      images:
        typeof product.images === "string"
          ? JSON.parse(product.images)
          : product.images,
      categories:
        typeof product.categories === "string"
          ? JSON.parse(product.categories)
          : product.categories,
      colors:
        typeof (product as any).colors === "string"
          ? JSON.parse((product as any).colors as any)
          : (product as any).colors,
      dimensions:
        typeof product.dimensions === "string"
          ? JSON.parse(product.dimensions)
          : product.dimensions,
      delivery:
        typeof product.delivery === "string"
          ? JSON.parse(product.delivery)
          : product.delivery,
    };

    return res.status(200).json({
      success: true,
      data: parsedProduct,
    });
  } catch (error: any) {
    console.error("Get product by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

export const getProductsByCategory = async (req: JwtPayload, res: Response) => {
  try {
    let { category } = req.params;

    // Decode the category parameter from URL
    category = decodeURIComponent(category);

    const { page = "1", limit = "10" } = req.query as {
      page?: string;
      limit?: string;
    };

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // For MySQL/MariaDB, use JSON_CONTAINS instead of Op.contains
    const { count, rows: products } = await Products.findAndCountAll({
      where: sequelize.where(
        sequelize.fn(
          "JSON_CONTAINS",
          sequelize.col("categories"),
          sequelize.literal(`'"${category}"'`)
        ),
        1
      ),
      limit: limitNum,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    // Parse JSON strings to objects for each product
    const parsedProducts = products.map((product) => ({
      ...product.toJSON(),
      specifications:
        typeof product.specifications === "string"
          ? JSON.parse(product.specifications)
          : product.specifications,
      images:
        typeof product.images === "string"
          ? JSON.parse(product.images)
          : product.images,
      categories:
        typeof product.categories === "string"
          ? JSON.parse(product.categories)
          : product.categories,
      colors:
        typeof (product as any).colors === "string"
          ? JSON.parse((product as any).colors as any)
          : (product as any).colors,
      dimensions:
        typeof product.dimensions === "string"
          ? JSON.parse(product.dimensions)
          : product.dimensions,
      delivery:
        typeof product.delivery === "string"
          ? JSON.parse(product.delivery)
          : product.delivery,
    }));

    const totalPages = Math.ceil(count / limitNum);

    return res.status(200).json({
      success: true,
      data: {
        products: parsedProducts,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalProducts: count,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error: any) {
    console.error("Get products by category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products by category",
      error: error.message,
    });
  }
};

export const searchProducts = async (req: JwtPayload, res: Response) => {
  try {
    const { q } = req.query as { q: string };
    const { page = "1", limit = "10" } = req.query as {
      page?: string;
      limit?: string;
    };

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: products } = await Products.findAndCountAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { sku: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
        ],
      },
      limit: limitNum,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limitNum);

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalProducts: count,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error: any) {
    console.error("Search products error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search products",
      error: error.message,
    });
  }
};
