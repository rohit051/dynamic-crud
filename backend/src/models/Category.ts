import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  name: string;
  domainName: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema<ICategory> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    domainName: { type: String, required: true, lowercase: true, trim: true, index: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.index({ domainName: 1, name: 1 }, { unique: true });

const CategoryModel =
  (mongoose.models.Category as mongoose.Model<ICategory>) ||
  mongoose.model<ICategory>("Category", CategorySchema);

export default CategoryModel;
