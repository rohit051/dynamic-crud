import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  title: string;
  description?: string;
  price: number;
  currency: string;
  stock: number;
  categories: string[];
  images: string[];
  sku?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
    currency: { type: String, required: true, default: "USD" },
    stock: { type: Number, default: 0 },
    categories: { type: [String], default: [] },
    images: { type: [String], default: [] },
    sku: { type: String, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ProductModel = (mongoose.models.Product as mongoose.Model<IProduct>) || mongoose.model<IProduct>("Product", ProductSchema);

export default ProductModel;
