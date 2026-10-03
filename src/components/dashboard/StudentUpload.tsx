"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { uploadStudentExcel } from "@/actions/student-actions";
import { Upload } from "lucide-react";

export default function StudentUpload({ courseId, courseName }: { courseId: string; courseName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("courseId", courseId);

    const result = await uploadStudentExcel(formData);
    setLoading(false);
    
    // Reset file input
    e.target.value = '';

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="mt-6 p-4 border border-slate-200 rounded-lg bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-800">Upload Students</h4>
        <p className="text-xs text-gray-500 mt-1">
          Upload an Excel file with student details for {courseName}.<br/>
          Required columns: "Name of student" and "Roll No."
        </p>
      </div>
      <div>
        <label className="cursor-pointer flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition">
          <Upload className="w-4 h-4 mr-2" />
          {loading ? "Uploading..." : "Select Excel File"}
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            onChange={handleUpload} 
            disabled={loading}
          />
        </label>
      </div>
    </div>
  );
}
