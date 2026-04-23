import mongoose, { Schema, Document } from 'mongoose';

export interface IAttainment extends Document {
  courseId: mongoose.Types.ObjectId;
  coId: mongoose.Types.ObjectId;
  directAttainment: number; // e.g., level 0-3 based on calculations
  indirectAttainment: number; // e.g., level 0-3 based on feedback
  finalAttainment: number; // e.g., (direct * 0.8) + (indirect * 0.2)
}

const AttainmentSchema: Schema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  coId: { type: Schema.Types.ObjectId, ref: 'CO', required: true },
  directAttainment: { type: Number, required: true },
  indirectAttainment: { type: Number, required: true },
  finalAttainment: { type: Number, required: true },
}, { timestamps: true });

AttainmentSchema.index({ courseId: 1, coId: 1 }, { unique: true });

export default mongoose.models.Attainment || mongoose.model<IAttainment>('Attainment', AttainmentSchema);
