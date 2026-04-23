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
  
  if (!name || !email || !password) return { error: "All fields required" };
  
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
  const program = formData.get("program") as string;
  const year = formData.get("year") as string;
  const academicYear = formData.get("academicYear") as string;
  const semester= formData.get("semester") as string;
  const section = formData.get("section")as string;

  if (!name || !code || !departmentId || !facultyId || !session || !year) return { error: "All fields required" };
  
  await dbConnect();
  try {
    const existing = await Course.findOne({ code, session, year, academicYear });
    if (existing) return { error: "Course code already exists for this session, year, and academic year!" };

    await Course.create({ name, code, departmentId, facultyId, session, program, year, academicYear, semester, section});
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
