import mongoose, { Schema, Document } from 'mongoose';

export interface IMapping extends Document {
  coId: mongoose.Types.ObjectId;
  poId: mongoose.Types.ObjectId;
  value: number; // 0, 1, 2, 3
}

const MappingSchema: Schema = new Schema({
  coId: { type: Schema.Types.ObjectId, ref: 'CO', required: true },
  poId: { type: Schema.Types.ObjectId, ref: 'PO', required: true },
  value: { type: Number, required: true, enum: [0, 1, 2, 3] },
}, { timestamps: true });

// Prevent duplicate mappings for the same CO-PO pair
MappingSchema.index({ coId: 1, poId: 1 }, { unique: true });

export default mongoose.models.Mapping || mongoose.model<IMapping>('Mapping', MappingSchema);
