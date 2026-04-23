import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  value: string;
}

const SettingSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
