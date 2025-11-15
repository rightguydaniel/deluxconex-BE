import { DataTypes, Model } from "sequelize";
import { database } from "../configs/database/database";
import { Users } from "./users";
import { Orders } from "./orders";
import { Invoices } from "./invoices";

export enum WirePaymentStatus {
  PENDING = "pending", // user requested wire, waiting for admin bank details
  ISSUED = "issued", // bank details and link issued to user
  PROOF_SUBMITTED = "proof_submitted", // user uploaded PoP
  VERIFIED = "verified", // admin verified payment
  REJECTED = "rejected", // admin rejected payment
  EXPIRED = "expired",
}

export interface PaymentRequestsAttributes {
  id: string;
  userId: string;
  orderId: string;
  invoiceId: string;
  status: WirePaymentStatus;
  // Bank / wire details
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  bankName?: string;
  expiresAt?: Date | null;
  linkToken?: string | null;
  // Proof of payment
  proofUrl?: string | null;
  notes?: string | null;
}

export class PaymentRequests extends Model<PaymentRequestsAttributes> {}

PaymentRequests.init(
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
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Orders,
        key: "id",
      },
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Invoices,
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM,
      values: Object.values(WirePaymentStatus),
      defaultValue: WirePaymentStatus.PENDING,
    },
    accountName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    routingNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    linkToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    proofUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: database,
    tableName: "PaymentRequests",
    timestamps: true,
  }
);

export default PaymentRequests;

