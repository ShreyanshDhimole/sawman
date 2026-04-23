import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  registerNumber: string; // Acts as Roll No
  name: string;
  email?: string;
  contactNo?: string;
  courseId: mongoose.Types.ObjectId; // For simplicity, assume one course mapped at a time, or array
}

const StudentSchema: Schema = new Schema({
  registerNumber: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  contactNo: { type: String },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
}, { timestamps: true });

export default mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
