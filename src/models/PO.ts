import mongoose, { Schema, Document } from 'mongoose';

export interface IPO extends Document {
  code: string; // e.g., 'PO1', 'PO2', ..., 'PO12' or 'PSO1' or 'PEO1'
  description: string;
  type: string;
}

const POSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['PO', 'PSO', 'PEO'], default: 'PO' },
}, { timestamps: true });

export default mongoose.models.PO || mongoose.model<IPO>('PO', POSchema);
