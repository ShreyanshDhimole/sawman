"use server";

import dbConnect from "@/lib/mongoose";
import Course from "@/models/Course";
import CO from "@/models/CO";
import PO from "@/models/PO";
import Mapping from "@/models/Mapping";
import Marks from "@/models/Marks";
import Student from "@/models/Student";
import Attainment from "@/models/Attainment";
import {
  calculateAverageAttainment,
  calculateFinalCourseAttainment,
  calculateInternalCOAttainment,
  calculateEndSemCOAttainment,
  calculateOverallDirectAttainment,
  type StoredMark,
} from "@/lib/calculations";

function roundToTwo(value: number) {
  return Number(value.toFixed(2));
}

function outcomeCodeSortValue(code: string) {
  const match = code.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return [code, 0] as const;

  const [, prefix, number] = match;
  const prefixRank = prefix === "PO" ? 0 : prefix === "PSO" ? 1 : 2;
  return [`${prefixRank}-${prefix}`, Number(number)] as const;
}

function sortByOutcomeCode<T extends { code: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const [aPrefix, aNumber] = outcomeCodeSortValue(a.code);
    const [bPrefix, bNumber] = outcomeCodeSortValue(b.code);
    return aPrefix.localeCompare(bPrefix) || aNumber - bNumber || a.code.localeCompare(b.code);
  });
}

export async function generateCourseReportData(
  courseId: string,
  indirectLevels: Record<string, number> = {},
  saveIndirectLevels = false
) {
  await dbConnect();
  
  const course = await Course.findById(courseId).populate("departmentId").lean() as any;
  if (!course) throw new Error("Course not found");

  const cos = await CO.find({ courseId }).sort({ code: 1 }).lean();
  const pos = await PO.find({}).lean();
  const students = await Student.find({ courseId }).sort({ registerNumber: 1 }).lean();
  
  // Mapping model has no courseId — query by CO IDs that belong to this course
  const coIds = cos.map((co: any) => co._id);
  const mappings = await Mapping.find({ coId: { $in: coIds } }).lean();
  const marks = await Marks.find({ courseId, coId: { $in: coIds } }).lean();
  const savedAttainments = await Attainment.find({ courseId, coId: { $in: coIds } }).lean();
  const savedIndirectMap = new Map(
    savedAttainments.map((item: any) => [item.coId.toString(), Number(item.indirectAttainment) || 0])
  );

  const internalReportRows = [];
  const endSemesterRows = [];
  const overallCourseRows = [];
  const coAttainments: Record<string, number> = {};
  const studentIds = students.map((student: any) => student._id.toString());

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

    const internalAttainment = calculateInternalCOAttainment(studentIds, coMarks);
    const endSemAttainment = calculateEndSemCOAttainment(studentIds, coMarks);
    const coIdString = co._id.toString();
    const hasSubmittedIndirect = Object.prototype.hasOwnProperty.call(indirectLevels, coIdString);
    const indirectLevel = Number(
      hasSubmittedIndirect
        ? indirectLevels[coIdString]
        : savedIndirectMap.get(coIdString) ?? 0
    );
    const overallDirectLevel = calculateOverallDirectAttainment(endSemAttainment.avgLevel, internalAttainment.avgLevel);
    const finalAttainment = calculateFinalCourseAttainment(overallDirectLevel, indirectLevel);
    coAttainments[coIdString] = finalAttainment;

    if (saveIndirectLevels && hasSubmittedIndirect) {
      await Attainment.findOneAndUpdate(
        { courseId, coId: co._id },
        {
          courseId,
          coId: co._id,
          directAttainment: overallDirectLevel,
          indirectAttainment: indirectLevel,
          finalAttainment,
        },
        { upsert: true, new: true }
      );
    }

    const internalStudentRows = internalAttainment.studentRows.map((row) => {
      const student = students.find((item: any) => item._id.toString() === row.studentId);
      return {
        registerNumber: student?.registerNumber || "",
        name: student?.name || "",
        ...row,
      };
    });

    const endSemStudentRows = endSemAttainment.studentRows.map((row) => {
      const student = students.find((item: any) => item._id.toString() === row.studentId);
      return {
        registerNumber: student?.registerNumber || "",
        name: student?.name || "",
        ...row,
      };
    });

    internalReportRows.push({
      coId: co._id.toString(),
      coCode: co.code,
      description: co.description,
      avgPercentage: internalAttainment.avgPercentage,
      attainmentLevel: internalAttainment.avgLevel,
      studentCount: internalAttainment.studentCount,
      studentRows: internalStudentRows,
    });

    endSemesterRows.push({
      coId: co._id.toString(),
      coCode: co.code,
      description: co.description,
      avgPercentage: endSemAttainment.avgPercentage,
      attainmentLevel: endSemAttainment.avgLevel,
      studentCount: endSemAttainment.studentCount,
      studentRows: endSemStudentRows,
    });

    overallCourseRows.push({
      coId: co._id.toString(),
      coCode: co.code,
      description: co.description,
      internalLevelAvg: internalAttainment.avgLevel,
      endSemLevelAvg: endSemAttainment.avgLevel,
      overallDirectLevel,
      indirectLevel,
      finalAttainment,
    });
  }

  const overallCourseAttainment = calculateAverageAttainment(
    overallCourseRows.map((row: any) => row.finalAttainment)
  );

  const mappedPoIds = new Set(mappings.map((mapping: any) => mapping.poId.toString()));
  const mappedPos = sortByOutcomeCode(
    (pos as any[]).filter((po: any) => mappedPoIds.has(po._id.toString()))
  );
  const mappingValueMap = new Map(
    mappings.map((mapping: any) => [
      `${mapping.coId.toString()}-${mapping.poId.toString()}`,
      Number(mapping.value) || 0,
    ])
  );

  const poMatrixRows = cos.map((co: any) => ({
    coId: co._id.toString(),
    coCode: co.code,
    values: Object.fromEntries(
      mappedPos.map((po: any) => {
        const value = mappingValueMap.get(`${co._id.toString()}-${po._id.toString()}`) || 0;
        return [po._id.toString(), value];
      })
    ),
  }));

  const poAverages = Object.fromEntries(
    mappedPos.map((po: any) => {
      const values = poMatrixRows
        .map((row) => Number(row.values[po._id.toString()]) || 0)
        .filter((value) => value > 0);

      return [
        po._id.toString(),
        values.length ? roundToTwo(values.reduce((sum, value) => sum + value, 0) / values.length) : 0,
      ];
    })
  );

  const overallPoAttainment = {
    columns: mappedPos.map((po: any) => ({
      poId: po._id.toString(),
      poCode: po.code,
      description: po.description,
    })),
    rows: poMatrixRows,
    averages: poAverages,
    attainment: Object.fromEntries(
      mappedPos.map((po: any) => {
        const average = Number(poAverages[po._id.toString()]) || 0;
        return [po._id.toString(), average ? roundToTwo((overallCourseAttainment / 3) * average) : 0];
      })
    ),
  };

  return JSON.parse(JSON.stringify({
    course,
    internalReportRows,
    endSemesterRows,
    overallCourseRows,
    overallCourseAttainment,
    overallPoAttainment,
  }));
}
