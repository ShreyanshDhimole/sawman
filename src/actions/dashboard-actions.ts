"use server";

import dbConnect from "@/lib/mongoose";
import Department from "@/models/Department";
import Course from "@/models/Course";
import User from "@/models/User";
import Student from "@/models/Student";
import CO from "@/models/CO";
import PO from "@/models/PO";
import Marks from "@/models/Marks";
import Mapping from "@/models/Mapping";
import { calculateInternalCOAttainment, calculatePOAttainment, type StoredMark } from "@/lib/calculations";
import { getCalculationConfig } from "@/lib/getCalcConfig";

// ─── Admin Dashboard Stats ────────────────────────────────
export async function getAdminDashboardStats() {
  await dbConnect();
  const calcConfig = await getCalculationConfig();

  const [deptCount, courseCount, facultyCount, studentCount] = await Promise.all([
    Department.countDocuments(),
    Course.countDocuments(),
    User.countDocuments({ role: "faculty" }),
    Student.countDocuments(),
  ]);

  // Compute institution-wide PO attainment distribution
  // Get all courses, compute CO attainments, then aggregate POs
  const courses = await Course.find({}).lean();
  const pos = await PO.find({}).sort({ code: 1 }).lean();

  const allCoAttainments: Record<string, number> = {};
  const allMappings: { coId: string; poId: string; value: number }[] = [];

  for (const course of courses) {
    const cos = await CO.find({ courseId: course._id }).lean();
    const students = await Student.find({ courseId: course._id }).lean();
    const studentIds = students.map((student: any) => student._id.toString());
    const marks = await Marks.find({ courseId: course._id }).lean();

    for (const co of cos) {
      const coMarks = marks
        .filter((mark: any) => mark.coId.toString() === co._id.toString())
        .map((mark: any) => ({
          studentId: mark.studentId.toString(),
          coId: mark.coId.toString(),
          examType: mark.examType,
          score: mark.score,
          maxScore: mark.maxScore,
        })) as StoredMark[];
      const attainment = calculateInternalCOAttainment(studentIds, coMarks, calcConfig);
      allCoAttainments[co._id.toString()] = attainment.avgLevel;
    }

    const coIds = cos.map((c: any) => c._id);
    const mappings = await Mapping.find({ coId: { $in: coIds } }).lean();
    mappings.forEach((m: any) => {
      allMappings.push({ coId: m.coId.toString(), poId: m.poId.toString(), value: m.value });
    });
  }

  const poScores = calculatePOAttainment(allCoAttainments, allMappings);

  const poChartData = pos.map((p: any) => ({
    name: p.code,
    attainment: poScores[p._id.toString()] || 0,
  }));

  // Calculate overall average attainment
  const poValues = poChartData.map(p => p.attainment).filter(v => v > 0);
  const overallAvg = poValues.length > 0
    ? parseFloat((poValues.reduce((a, b) => a + b, 0) / poValues.length).toFixed(1))
    : 0;

  return JSON.parse(JSON.stringify({
    deptCount,
    courseCount,
    facultyCount,
    studentCount,
    overallAvg,
    poChartData,
  }));
}

// ─── Faculty Dashboard Stats ──────────────────────────────
export async function getFacultyDashboardStats(email: string) {
  await dbConnect();
  const calcConfig = await getCalculationConfig();

  const user = await User.findOne({ email });
  if (!user) return null;

  const courses = await Course.find({ facultyId: user._id }).populate("departmentId").lean();

  const courseAttainments: any[] = [];
  let totalLevelSum = 0;
  let totalCoCount = 0;

  for (const course of courses) {
    const cos = await CO.find({ courseId: course._id }).lean();
    const studentsRaw = await Student.find({ courseId: course._id }).lean();
    const studentIds = studentsRaw.map((student: any) => student._id.toString());
    const marks = await Marks.find({ courseId: course._id }).lean();
    const coRows: any[] = [];

    for (const co of cos) {
      const coMarks = marks
        .filter((mark: any) => mark.coId.toString() === co._id.toString())
        .map((mark: any) => ({
          studentId: mark.studentId.toString(),
          coId: mark.coId.toString(),
          examType: mark.examType,
          score: mark.score,
          maxScore: mark.maxScore,
        })) as StoredMark[];
      const attainment = calculateInternalCOAttainment(studentIds, coMarks, calcConfig);

      coRows.push({
        coCode: co.code,
        avgPercentage: attainment.avgPercentage,
        attainmentLevel: attainment.avgLevel,
        attainmentLevelScaled: Number((attainment.avgLevel * (100 / 3)).toFixed(2)),
      });

      totalLevelSum += attainment.avgLevel;
      totalCoCount++;
    }

    const students = studentsRaw.map((s: any) => ({
      _id: s._id.toString(),
      name: s.name,
      registerNumber: s.registerNumber,
      email: s.email || '',
      contactNo: s.contactNo || ''
    }));

    courseAttainments.push({
      courseId: (course as any)._id.toString(),
      courseName: (course as any).name,
      courseCode: (course as any).code,
      session: (course as any).session,
      program: (course as any).program,
      year: (course as any).year,
      coRows,
      students
    });
  }

  const avgAttainment = totalCoCount > 0
    ? parseFloat((totalLevelSum / totalCoCount).toFixed(1))
    : 0;

  const pendingCount = courseAttainments.filter(c => c.coRows.length === 0 || c.coRows.every((r: any) => r.avgPercentage === 0)).length;

  return JSON.parse(JSON.stringify({
    courseCount: courses.length,
    pendingCount,
    avgAttainment,
    courseAttainments,
  }));
}
