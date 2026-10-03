import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  name: string;
  code: string;
  departmentId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  session?: string;
  academicYear?: string;
  program?: string;
  year?: string;
  semester?: string;
  section?: string;
  syllabus?: string;
  lecturePlan?: any;
  attendance?: any[];
  mst1Paper?: string;
  mst2Paper?: string;
  endsemPaper?: string;
  assignments?: any[];
  timeTablePdf?: string;
}

const CourseSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  facultyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: String },
  academicYear: { type: String },
  program: { type: String, default: 'B.Tech' },
  year: { type: String },
  semester: { type: String },
  section: { type: String },
  syllabus: { type: String },
  lecturePlan: { type: Schema.Types.Mixed },
  attendance: { type: Schema.Types.Mixed },
  mst1Paper: { type: String },
  mst2Paper: { type: String },
  endsemPaper: { type: String },
  assignments: { type: Schema.Types.Mixed },
  timeTablePdf: { type: String },
}, { timestamps: true });

export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
