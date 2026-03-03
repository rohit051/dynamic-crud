import mongoose, { Document, Schema } from "mongoose";

export interface ISubcategory extends Document {
  name: string;
  description?: string;
  category: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubcategorySchema: Schema<ISubcategory> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SubcategorySchema.index({ category: 1, name: 1 }, { unique: true });

const SubcategoryModel =
  (mongoose.models.Subcategory as mongoose.Model<ISubcategory>) ||
  mongoose.model<ISubcategory>("Subcategory", SubcategorySchema);

export default SubcategoryModel;
