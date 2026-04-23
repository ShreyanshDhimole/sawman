import mongoose, { Schema, Document } from 'mongoose';

export interface ICO extends Document {
  courseId: mongoose.Types.ObjectId;
  code: string; // e.g., 'CO1', 'CO2'
  description: string;
}

const COSchema: Schema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  code: { type: String, required: true },
  description: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.CO || mongoose.model<ICO>('CO', COSchema);
