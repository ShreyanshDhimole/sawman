"use server";

import dbConnect from "@/lib/mongoose";
import Marks from "@/models/Marks";
import Student from "@/models/Student";
import AssessmentUpload from "@/models/AssessmentUpload";
import { revalidatePath } from "next/cache";

type StudentUploadRow = { registerNumber: string; name: string };
type SavedQuestionRow = { name: string; text: string; coId: string; maxScore: string };

export async function getSavedMarksUpload(courseId: string, examType: string) {
  await dbConnect();

  const upload = await AssessmentUpload.findOne({ courseId, examType }).lean();
  return JSON.parse(JSON.stringify(upload));
}

export async function processMarksBatchByQuestions(
  courseId: string, 
  examType: string, 
  questionConfig: Record<string, { coId: string, maxScore: number }>, 
  records: any[],
  savedUpload?: {
    students: StudentUploadRow[];
    questionRows: SavedQuestionRow[];
    questionScores: Record<string, Record<string, string>>;
  }
) {
  await dbConnect();
  
  try {
    let processedMarks = 0;

    for (const record of records) {
      if (!record.registerNumber) continue;

      const student = await Student.findOneAndUpdate(
        { registerNumber: String(record.registerNumber).trim(), courseId },
        { $setOnInsert: { name: record.name || "Unknown Student", courseId } },
        { upsert: true, new: true }
      );
      
      const aggregationMap: Record<string, { sumScore: number, sumMaxScore: number }> = {};

      for (const questionHeader in record.qScores) {
          const config = questionConfig[questionHeader];
          const rawScore = Number(record.qScores[questionHeader]);
          
          if (!config || !config.coId || isNaN(rawScore)) continue;

          const coId = config.coId;
          if (!aggregationMap[coId]) {
              aggregationMap[coId] = { sumScore: 0, sumMaxScore: 0 };
          }
          aggregationMap[coId].sumScore += rawScore;
          aggregationMap[coId].sumMaxScore += config.maxScore;
      }

      for (const coId in aggregationMap) {
          const agg = aggregationMap[coId];

          await Marks.findOneAndUpdate(
            { studentId: student._id, courseId, coId, examType },
            { score: agg.sumScore, maxScore: agg.sumMaxScore },
            { upsert: true }
          );
          processedMarks++;
      }
    }

    if (savedUpload) {
      await AssessmentUpload.findOneAndUpdate(
        { courseId, examType },
        {
          courseId,
          examType,
          mode: "questions",
          students: savedUpload.students,
          questionRows: savedUpload.questionRows,
          questionScores: savedUpload.questionScores,
          coMaxMarks: {},
          coScores: {},
        },
        { upsert: true, new: true }
      );
    }
    
    revalidatePath("/dashboard/marks-upload");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard");
    return { success: true, message: `Saved ${processedMarks} CO mark records for ${examType.toUpperCase()}.` };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function processCOMarksBatch(
  courseId: string,
  examType: "assignment" | "class_work" | "end_semester" | "sessional_work",
  coMaxMarks: Record<string, number>,
  records: { registerNumber: string; name?: string; coScores: Record<string, number> }[],
  savedUpload?: {
    students: StudentUploadRow[];
    coMaxMarks: Record<string, string>;
    coScores: Record<string, Record<string, string>>;
  }
) {
  await dbConnect();

  try {
    let processedMarks = 0;

    for (const record of records) {
      if (!record.registerNumber) continue;

      const student = await Student.findOneAndUpdate(
        { registerNumber: String(record.registerNumber).trim(), courseId },
        { $setOnInsert: { name: record.name || "Unknown Student", courseId } },
        { upsert: true, new: true }
      );

      for (const coId of Object.keys(coMaxMarks)) {
        const maxScore = Number(coMaxMarks[coId]) || 0;
        const score = Number(record.coScores?.[coId]) || 0;
        if (maxScore <= 0) continue;

        await Marks.findOneAndUpdate(
          { studentId: student._id, courseId, coId, examType },
          { score, maxScore },
          { upsert: true }
        );
        processedMarks++;
      }
    }

    if (savedUpload) {
      await AssessmentUpload.findOneAndUpdate(
        { courseId, examType },
        {
          courseId,
          examType,
          mode: "co",
          students: savedUpload.students,
          questionRows: [],
          questionScores: {},
          coMaxMarks: savedUpload.coMaxMarks,
          coScores: savedUpload.coScores,
        },
        { upsert: true, new: true }
      );
    }

    revalidatePath("/dashboard/marks-upload");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard");
    return { success: true, message: `Saved ${processedMarks} ${examType} CO entries.` };
  } catch (e: any) {
    return { error: e.message };
  }
}
