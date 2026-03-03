import mongoose, { Document, Schema } from "mongoose";

export interface IDomain extends Document {
  name: string;
  displayName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DomainSchema: Schema<IDomain> = new Schema(
  {
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const DomainModel =
  (mongoose.models.Domain as mongoose.Model<IDomain>) ||
  mongoose.model<IDomain>("Domain", DomainSchema);

export default DomainModel;
