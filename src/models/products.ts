import { DataTypes, Model } from "sequelize";
import { database } from "../configs/database/database";

interface ProductSpec {
  title?: string;
  value?: string;
  [key: string]: any;
}

interface Condition {
  condition: string;
  price: number;
  images: string[];
  description?: string;
  specifications?: (string | ProductSpec)[];
}

interface Dimension {
  dimension: string;
  price?: number;
  images?: string[];
  description?: string;
  specifications?: (string | ProductSpec)[];
  conditions?: Condition[];
}

interface DeliveryOption {
  method: string;
  price: number;
}

export interface ProductsAttributes {
  id: string;
  name: string;
  sku?: string;
  price: number;
  description: string;
  specifications: (string | ProductSpec)[];
  images: string[];
  categories?: string[];
  dimensions?: Dimension[];
  delivery?: DeliveryOption[];
}

export class Products extends Model<ProductsAttributes> {
  [x: string]: any;
}

Products.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    specifications: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    images: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    categories: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    dimensions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    delivery: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize: database,
    tableName: "Products",
    timestamps: true,
  }
);

export default Products;
