import { DataTypes, Model } from "sequelize";
import { database } from "../configs/database/database";
import { Users } from "./users";

export enum CardType {
  VISA = "visa",
  MASTERCARD = "mastercard",
  AMEX = "amex",
  DISCOVER = "discover",
  JCB = "jcb",
  DINERS_CLUB = "diners_club",
  OTHER = "other",
}

export interface PaymentMethodAttributes {
  id: string;
  userId: string;
  isDefault: boolean;
  cardType: CardType;
  cardholderName: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv?: string;
  lastFourDigits: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  // PayPal gateway fields
  paypalPaymentMethodId?: string;
  paypalCustomerId?: string;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class PaymentMethods extends Model<PaymentMethodAttributes> {}

PaymentMethods.init(
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
      references: {
        model: Users,
        key: "id",
      },
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    cardType: {
      type: DataTypes.ENUM,
      values: Object.values(CardType),
      allowNull: false,
    },
    cardholderName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cardNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiryMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12,
      },
    },
    expiryYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: new Date().getFullYear(),
      },
    },
    cvv: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    lastFourDigits: {
      type: DataTypes.STRING(4),
      allowNull: false,
      validate: {
        len: [4, 4],
      },
    },
    billingAddress: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // PayPal integration fields
    paypalPaymentMethodId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    paypalCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: database,
    tableName: "PaymentMethods",
    timestamps: true,
  }
);

// Set up associations
PaymentMethods.belongsTo(Users, { foreignKey: "userId" });
Users.hasMany(PaymentMethods, { foreignKey: "userId" });

export default PaymentMethods;
