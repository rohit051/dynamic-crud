import mongoose, { Document, Schema } from "mongoose";

export interface INews extends Document {
  title: string;
  content: string;
  categoryId: mongoose.Types.ObjectId;
  subcategoryId?: mongoose.Types.ObjectId | null;
  createdBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema: Schema<INews> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    subcategoryId: { type: Schema.Types.ObjectId, ref: "Subcategory", default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const NewsModel =
  (mongoose.models.News as mongoose.Model<INews>) ||
  mongoose.model<INews>("News", NewsSchema);

export default NewsModel;
