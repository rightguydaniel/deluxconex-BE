import { DataTypes, Model } from "sequelize";
import { database } from "../configs/database/database";
import { Users } from "./users";

export enum AddressType {
  BILLING = "billing",
  SHIPPING = "shipping",
}

export interface AddressesAttributes {
  id: string;
  userId: string;
  type: AddressType;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  phone?: string;
  additionalInfo?: string;
}

export class Addresses extends Model<AddressesAttributes> {}
// export class Addresses extends Model<AddressesAttributes> implements AddressesAttributes {


Addresses.init(
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
    type: {
      type: DataTypes.ENUM,
      values: Object.values(AddressType),
      allowNull: false,
    },
    street: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    additionalInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: database,
    tableName: "Addresses",
    timestamps: true,
  }
);

export default Addresses;