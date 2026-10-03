"use server";

import dbConnect from "@/lib/mongoose";
import Department from "@/models/Department";
import Course from "@/models/Course";
import { revalidatePath } from "next/cache";

//Refreshes UI after DB change
//Without this → UI won’t update 


import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function createFaculty(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  const missing = [];
  if (!name) missing.push("Name");
  if (!email) missing.push("Email");
  if (!password) missing.push("Password");
  
  if (missing.length > 0) return { error: `Missing required fields: ${missing.join(", ")}` };
  
  await dbConnect();
  try {
    const existing = await User.findOne({ email });
    if (existing) return { error: "Faculty email already registered!" };
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword, role: "faculty" });
    revalidatePath("/dashboard/courses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateFaculty(id: string, name: string, email: string) {
  if (!name || !email) return { error: "Name and email are required" };
  await dbConnect();
  try {
    const existing = await User.findOne({ email, _id: { $ne: id } });
    if (existing) return { error: "Another faculty already uses this email!" };

    await User.findByIdAndUpdate(id, { name, email });
    revalidatePath("/dashboard/courses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteFaculty(id: string) {
  await dbConnect();
  try {
    await User.findByIdAndDelete(id);
    revalidatePath("/dashboard/courses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function createDepartment(formData: FormData) {
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  
  if (!name || !code) return { error: "Name and code required" };
  
  await dbConnect();
  try {
    const existing = await Department.findOne({ code });
    if (existing) return { error: "Department code already exists!" };
    
    await Department.create({ name, code });
    revalidatePath("/dashboard/courses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function createCourse(formData: FormData) {
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const departmentId = formData.get("departmentId") as string;
  const facultyId = formData.get("facultyId") as string;
  const session = formData.get("session") as string;
  const academicYear = formData.get("academicYear") as string;
  const program = formData.get("program") as string;
  const year = formData.get("year") as string;
  const semester= formData.get("semester") as string;
  const section = formData.get("section")as string;

  const missing = [];
  if (!name) missing.push("Course Name");
  if (!code) missing.push("Course Code");
  if (!departmentId) missing.push("Department");
  if (!facultyId) missing.push("Faculty");
  if (!session) missing.push("Session");
  if (!year) missing.push("Year");

  if (missing.length > 0) return { error: `Missing required fields: ${missing.join(", ")}` };
  
  await dbConnect();
  try {
    const faculty = await User.findById(facultyId);
    if (!faculty) return { error: "The selected faculty no longer exists in the system. Please refresh the page and try again." };
    if (section === "Both") {
      const existingA = await Course.findOne({ code, session, year, section: "A" });
      const existingB = await Course.findOne({ code, session, year, section: "B" });
      if (existingA || existingB) return { error: "Course code already exists for this session and year in one of the sections!" };

      await Course.create({ name, code, departmentId, facultyId, session, academicYear, program, year, semester, section: "A" });
      await Course.create({ name, code, departmentId, facultyId, session, academicYear, program, year, semester, section: "B" });
    } else {
      const existing = await Course.findOne({ code, session, year, section });
      if (existing) return { error: `Course code already exists for section ${section || 'unassigned'} in this session and year!` };

      await Course.create({ name, code, departmentId, facultyId, session, academicYear, program, year, semester, section });
    }

    revalidatePath("/dashboard/courses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateCourse(id: string, data: any) {
  await dbConnect();
  try {
    if (data.facultyId) {
      if (data.facultyId === "") return { error: "Faculty selection cannot be empty." };
      const faculty = await User.findById(data.facultyId);
      if (!faculty) return { error: "The selected faculty no longer exists in the system." };
    }

    if (data.departmentId === "") return { error: "Department selection cannot be empty." };

    if (data.code && data.session && data.year) {
      const query: any = { code: data.code, session: data.session, year: data.year, _id: { $ne: id } };
      if (data.section) query.section = data.section;
      const existing = await Course.findOne(query);
      if (existing) return { error: `Course code already exists for section ${data.section || 'unassigned'} in this session and year!` };
    }

    await Course.findByIdAndUpdate(id, data);
    revalidatePath("/dashboard/courses");
    return { success: true };
  } catch (e: any) {
    if (e.name === 'CastError' && e.path === 'facultyId') {
       return { error: "Invalid faculty assigned. Please select a valid faculty from the list." };
    }
    return { error: e.message || "An unexpected error occurred while updating the course." };
  }
}

export async function deleteCourse(id: string) {
  await dbConnect();
  try {
    await Course.findByIdAndDelete(id);
    revalidatePath("/dashboard/courses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getDepartments() {
  await dbConnect();
  const dpts = await Department.find({}).lean();
  
  // Lean Don’t return full Mongoose documents, just give me plain JavaScript objects.

  return JSON.parse(JSON.stringify(dpts)); 
}

export async function getFaculty() {
  await dbConnect();
  const facs = await User.find({ role: "faculty" }).lean();
  return JSON.parse(JSON.stringify(facs));
}

import PO from "@/models/PO";

export async function updatePO(id: string, code: string, description: string) {
  await dbConnect();
  try {
    await PO.findByIdAndUpdate(id, { code, description });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/co-po-mapping");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function addOutcome(code: string, description: string, type: 'PO' | 'PSO' | 'PEO') {
  await dbConnect();
  try {
    const existing = await PO.findOne({ code });
    if (existing) return { error: `${type} with this code already exists!` };
    
    await PO.create({ code, description, type });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/co-po-mapping");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deletePO(id: string) {
  await dbConnect();
  try {
    await PO.findByIdAndDelete(id);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/co-po-mapping");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

import Setting from "@/models/Setting";

export async function updateGlobalSettings(keyValuePairs: Record<string, string>) {
  await dbConnect();
  try {
    const bulkOps = Object.keys(keyValuePairs).map(key => ({
      updateOne: {
        filter: { key },
        update: { $set: { value: keyValuePairs[key] } },
        upsert: true
      }
    }));
    if(bulkOps.length > 0) {
      await Setting.bulkWrite(bulkOps);
    }
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/course-file");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}
