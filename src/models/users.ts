import { DataTypes, Model } from "sequelize";
import { database } from "../configs/database/database";

export enum UsersRole {
  USER = "user",
  ADMIN = "admin",
}

export interface UsersAttributes {
  id?: string;
  full_name: string;
  user_name?: string;
  email: string;
  phone: string;
  password: string;
  role: UsersRole;
  blocked_at?: Date | null;
  deleted_at?: Date | null;
}

export class Users extends Model<UsersAttributes> {
  [x: string]: any;
}

Users.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM,
      values: Object.values(UsersRole),
      allowNull: false,
    },
    blocked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize: database,
    tableName: "Users",
    timestamps: true,
  }
);

export default Users;
