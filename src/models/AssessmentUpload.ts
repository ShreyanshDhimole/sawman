import mongoose, { Schema, Document } from "mongoose";

export interface IAssessmentUpload extends Document {
  courseId: mongoose.Types.ObjectId;
  examType: "mst1" | "mst2" | "assignment" | "class_work" | "end_semester" | "sessional_work";
  mode: "questions" | "co";
  students: { registerNumber: string; name: string }[];
  questionRows: { name: string; text: string; coId: string; maxScore: string }[];
  questionScores: Record<string, Record<string, string>>;
  coMaxMarks: Record<string, string>;
  coScores: Record<string, Record<string, string>>;
}

const AssessmentUploadSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    examType: {
      type: String,
      enum: ["mst1", "mst2", "assignment", "class_work", "end_semester", "sessional_work"],
      required: true,
    },
    mode: { type: String, enum: ["questions", "co"], required: true },
    students: [
      {
        registerNumber: { type: String, required: true },
        name: { type: String, required: true },
      },
    ],
    questionRows: [
      {
        name: { type: String, required: true },
        text: { type: String, default: "" },
        coId: { type: String, default: "" },
        maxScore: { type: String, default: "" },
      },
    ],
    questionScores: { type: Schema.Types.Mixed, default: {} },
    coMaxMarks: { type: Schema.Types.Mixed, default: {} },
    coScores: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

AssessmentUploadSchema.index({ courseId: 1, examType: 1 }, { unique: true });

export default mongoose.models.AssessmentUpload ||
  mongoose.model<IAssessmentUpload>("AssessmentUpload", AssessmentUploadSchema);
