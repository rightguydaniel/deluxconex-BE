import { DataTypes, Model } from "sequelize";
import { database } from "../configs/database/database";
import { Users } from "./users";

// Interface for Cart Item that matches your product structure
export interface CartItem {
  productId: string;
  name: string;
  basePrice: number; // The base price from the product
  quantity: number;
  image: string; // Main product image or selected variant image
  selectedColor?: string;
  selectedDimension?: {
    dimension: string;
    priceAdjustment?: number; // Price difference from base price
  };
  selectedCondition?: {
    condition: string;
    priceAdjustment?: number; // Price difference from base price
  };
  selectedDelivery?: {
    method: string;
    price: number;
  };
  // Calculated fields
  itemPrice: number; // Final price per item (base + dimension adj + condition adj)
  totalPrice: number; // itemPrice * quantity
}

export interface CartsAttributes {
  id: string;
  userId: string;
  items: CartItem[];
  updatedAt?: Date;
  // Calculated fields for the entire cart
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export class Carts extends Model<CartsAttributes> {}

Carts.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // One cart per user
      references: {
        model: Users,
        key: "id",
      },
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    shipping: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    tax: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize: database,
    tableName: "Carts",
    timestamps: true,
    createdAt: false, // We only care about when the cart was updated
  }
);

// Set up associations
Carts.belongsTo(Users, { foreignKey: "userId" });
Users.hasOne(Carts, { foreignKey: "userId" });

export default Carts;
