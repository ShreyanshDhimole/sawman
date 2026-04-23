import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
}

const DepartmentSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
}, { timestamps: true });

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
