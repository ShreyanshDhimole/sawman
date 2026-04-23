import mongoose, { Schema, Document } from 'mongoose';

export interface IMarks extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  coId: mongoose.Types.ObjectId;
  score: number;
  maxScore: number;
  examType: 'mst1' | 'mst2' | 'assignment' | 'class_work' | 'end_semester' | 'sessional_work';
}

const MarksSchema: Schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  coId: { type: Schema.Types.ObjectId, ref: 'CO', required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  examType: { type: String, enum: ['mst1', 'mst2', 'assignment', 'class_work', 'end_semester', 'sessional_work'], required: true },
}, { timestamps: true });

export default mongoose.models.Marks || mongoose.model<IMarks>('Marks', MarksSchema);
