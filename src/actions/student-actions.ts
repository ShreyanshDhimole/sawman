"use server"

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongoose";
import Student from "@/models/Student";
import * as xlsx from "xlsx";

export async function uploadStudentExcel(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const courseId = formData.get("courseId") as string;

    if (!file || !courseId) {
      return { success: false, message: "File or Course ID missing" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = xlsx.utils.sheet_to_json(worksheet);

    await dbConnect();

    const newStudents = [];

    for (const row of jsonData) {
      // Trying to find fields robustly regardless of exact case
      const name = row["Name of student"] || row["Name"] || row["name"] || row["Name of Student"];
      const rollNo = row["Roll No."] || row["Rollno."] || row["Roll No"] || row["rollno"] || row["Register Number"] || row["registerNumber"] || row["Roll no."];
      const email = row["Email ID"] || row["Email"] || row["email"] || row["email id"] || row["Email Id"];
      const contactNo = row["Contact No."] || row["Contact No"] || row["contact Number"] || row["contact no"] || row["Contact"] || row["Contact no."];

      if (name && rollNo) {
        newStudents.push({
          name: String(name).trim(),
          registerNumber: String(rollNo).trim(),
          email: email ? String(email).trim() : undefined,
          contactNo: contactNo ? String(contactNo).trim() : undefined,
          courseId
        });
      }
    }

    if (newStudents.length === 0) {
      return { success: false, message: "No valid students found. Ensure columns exist for 'Name of student' and 'Roll No.'" };
    }

    // Delete existing students for this course to replace them
    await Student.deleteMany({ courseId });

    // Insert new students
    await Student.insertMany(newStudents);

    revalidatePath("/dashboard");
    return { success: true, message: `Successfully inserted/updated ${newStudents.length} students.` };
  } catch (error: any) {
    console.error("Excel upload error:", error);
    return { success: false, message: error.message || "Failed to process Excel file" };
  }
}

export async function deleteStudent(studentId: string) {
  try {
    await dbConnect();
    await Student.findByIdAndDelete(studentId);
    revalidatePath("/dashboard");
    return { success: true, message: "Student deleted successfully" };
  } catch (error: any) {
    console.error("Delete student error:", error);
    return { success: false, message: error.message || "Failed to delete student" };
  }
}
