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
import Attainment from "@/models/Attainment";
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

  // ── Course-level completion tracking ──
  const courses = await Course.find({}).populate("departmentId").populate("facultyId").lean();
  const allCOs = await CO.find({}).lean();
  const allMarks = await Marks.find({}).lean();
  const allMappings = await Mapping.find({}).lean();
  const allAttainments = await Attainment.find({}).lean();
  const allStudents = await Student.find({}).lean();

  // Build lookup maps
  const cosByCourse = new Map<string, any[]>();
  for (const co of allCOs) {
    const cid = co.courseId.toString();
    if (!cosByCourse.has(cid)) cosByCourse.set(cid, []);
    cosByCourse.get(cid)!.push(co);
  }

  const marksByCourse = new Map<string, any[]>();
  for (const mark of allMarks) {
    const cid = mark.courseId.toString();
    if (!marksByCourse.has(cid)) marksByCourse.set(cid, []);
    marksByCourse.get(cid)!.push(mark);
  }

  const studentsByCourse = new Map<string, any[]>();
  for (const student of allStudents) {
    const cid = student.courseId.toString();
    if (!studentsByCourse.has(cid)) studentsByCourse.set(cid, []);
    studentsByCourse.get(cid)!.push(student);
  }

  const mappingsByCoId = new Map<string, any[]>();
  for (const mapping of allMappings) {
    const coId = mapping.coId.toString();
    if (!mappingsByCoId.has(coId)) mappingsByCoId.set(coId, []);
    mappingsByCoId.get(coId)!.push(mapping);
  }

  const attainmentByCourse = new Map<string, any[]>();
  for (const att of allAttainments) {
    const cid = att.courseId.toString();
    if (!attainmentByCourse.has(cid)) attainmentByCourse.set(cid, []);
    attainmentByCourse.get(cid)!.push(att);
  }

  // ── Per-course detailed status ──
  const courseDetails: any[] = [];
  let completedCourses = 0;
  let pendingMarksCourses = 0;
  let pendingMappingCourses = 0;

  // Department-wise aggregation
  const deptStats = new Map<string, { name: string; courses: number; students: number; completed: number }>();

  for (const course of courses) {
    const cid = (course as any)._id.toString();
    const cos = cosByCourse.get(cid) || [];
    const marks = marksByCourse.get(cid) || [];
    const students = studentsByCourse.get(cid) || [];
    const attainments = attainmentByCourse.get(cid) || [];

    const coIds = cos.map((c: any) => c._id.toString());
    const hasCOs = cos.length > 0;
    const hasStudents = students.length > 0;
    const hasMarks = marks.length > 0;

    // Check mapping completion
    let mappedCOCount = 0;
    for (const coId of coIds) {
      if (mappingsByCoId.has(coId) && mappingsByCoId.get(coId)!.some((m: any) => m.value > 0)) {
        mappedCOCount++;
      }
    }
    const hasMappings = mappedCOCount > 0 && mappedCOCount === cos.length;
    const hasAttainment = attainments.length > 0;

    // Determine unique exam types uploaded
    const examTypesUploaded = new Set(marks.map((m: any) => m.examType));

    // Determine status
    let status: "complete" | "in_progress" | "not_started" = "not_started";
    if (hasCOs && hasMarks && hasMappings && hasAttainment) {
      status = "complete";
      completedCourses++;
    } else if (hasCOs || hasMarks || hasStudents) {
      status = "in_progress";
    }

    if (!hasMarks) pendingMarksCourses++;
    if (!hasMappings && hasCOs) pendingMappingCourses++;

    // Department aggregation
    const dept = (course as any).departmentId;
    const deptId = dept?._id?.toString() || "unknown";
    const deptName = dept?.name || "Unknown";
    if (!deptStats.has(deptId)) {
      deptStats.set(deptId, { name: deptName, courses: 0, students: 0, completed: 0 });
    }
    const ds = deptStats.get(deptId)!;
    ds.courses++;
    ds.students += students.length;
    if (status === "complete") ds.completed++;

    courseDetails.push({
      _id: cid,
      name: (course as any).name,
      code: (course as any).code,
      session: (course as any).session || "",
      academicYear: (course as any).academicYear || "",
      faculty: (course as any).facultyId?.name || "Unassigned",
      department: deptName,
      studentCount: students.length,
      coCount: cos.length,
      marksUploaded: hasMarks,
      examTypes: Array.from(examTypesUploaded),
      mappingDone: hasMappings,
      mappedCOs: mappedCOCount,
      reportGenerated: hasAttainment,
      status,
    });
  }

  // Sort: not_started first, then in_progress, then complete
  const statusOrder = { not_started: 0, in_progress: 1, complete: 2 };
  courseDetails.sort((a, b) => statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]);

  // Dept chart data
  const departmentChartData = Array.from(deptStats.values()).map(d => ({
    name: d.name,
    courses: d.courses,
    students: d.students,
    completed: d.completed,
  }));

  return JSON.parse(JSON.stringify({
    deptCount,
    courseCount,
    facultyCount,
    studentCount,
    completedCourses,
    pendingMarksCourses,
    pendingMappingCourses,
    inProgressCourses: courseCount - completedCourses - (courseDetails.filter(c => c.status === "not_started").length),
    notStartedCourses: courseDetails.filter(c => c.status === "not_started").length,
    courseDetails,
    departmentChartData,
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
      const attainment = calculateInternalCOAttainment(studentIds, coMarks);

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
      section: (course as any).section,
      semester: (course as any).semester,
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
