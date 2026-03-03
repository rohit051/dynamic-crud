import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "user" | "admin";
  isActive: boolean;
  resetToken?: string;
  resetTokenExpiry?: Date;
  isVerified: boolean;
  verificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
  },
  { timestamps: true }
);

const UserModel = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default UserModel;
