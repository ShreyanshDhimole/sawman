"use server";

import dbConnect from "@/lib/mongoose";
import Course from "@/models/Course";
import CO from "@/models/CO";
import PO from "@/models/PO";
import Mapping from "@/models/Mapping";
import Student from "@/models/Student";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import Department from "@/models/Department";

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

export async function getFacultyCourses(facultyEmail: string) {
  await dbConnect();
  const User = mongoose.models.User;
  const faculty = await User.findOne({ email: facultyEmail });
  if (!faculty) return [];
  
  await import("@/models/Department");
  const courses = await Course.find({ facultyId: faculty._id }).populate("departmentId").lean();
  return JSON.parse(JSON.stringify(courses));
}

export async function getCOs(courseId: string) {
  await dbConnect();
  const cos = await CO.find({ courseId }).lean();
  return JSON.parse(JSON.stringify(sortByOutcomeCode(cos as any[])));
}

export async function getCourseStudents(courseId: string) {
  await dbConnect();
  const students = await Student.find({ courseId }).sort({ registerNumber: 1 }).lean();
  return JSON.parse(JSON.stringify(students));
}

export async function getPOs() {
  await dbConnect();
  const pos = await PO.find({}).lean();
  return JSON.parse(JSON.stringify(sortByOutcomeCode(pos as any[])));
}

export async function getMappings(courseId: string) {
  await dbConnect();
  const cos = await CO.find({ courseId }, '_id').lean();
  const coIds = cos.map(c => c._id);
  const mappings = await Mapping.find({ coId: { $in: coIds } }).lean();
  return JSON.parse(JSON.stringify(mappings));
}

export async function saveMapping(courseId: string, mappingsData: any[]) {
  await dbConnect();
  try {
    for (const data of mappingsData) {
      const { coId, poId, value } = data;
      await Mapping.findOneAndUpdate(
        { coId, poId },
        { value },
        { upsert: true, new: true }
      );
    }
    revalidatePath("/dashboard/co-po-mapping");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function createCO(formData: FormData) {
  const courseId = formData.get("courseId") as string;
  const code = formData.get("code") as string;
  const description = formData.get("description") as string;

  if (!courseId || !code || !description) return { error: "Missing fields" };

  await dbConnect();
  await CO.create({ courseId, code, description });
  revalidatePath("/dashboard/co-po-mapping");
  return { success: true };
}

// PRO UPGRADE: Batch Excel Processing for CO-PO Matrix
export async function uploadMappingBatch(courseId: string, rowsData: any[]) {
  await dbConnect();
  try {
    let processedCount = 0;

    const uploadedOutcomeCodes = new Set<string>();
    rowsData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const normalizedKey = key.trim().toUpperCase();
        if (/^(PO|PSO)\d+$/.test(normalizedKey)) {
          uploadedOutcomeCodes.add(normalizedKey);
        }
      });
    });

    for (const code of uploadedOutcomeCodes) {
      await PO.findOneAndUpdate(
        { code },
        { $setOnInsert: { code, description: `${code} target from uploaded matrix` } },
        { upsert: true, new: true }
      );
    }

    const pos = await PO.find({}).lean();
    const poCodeMap: Record<string, string> = {};
    pos.forEach(po => poCodeMap[po.code.trim().toLowerCase()] = po._id.toString());

    for (const row of rowsData) {
      const coCode = row["CO Code"] || row["CO"];
      const coDescription = row["Description"] || `Syllabus Outcome ${coCode}`;
      if (!coCode) continue; // Skip invalid spacer rows

      // 1. If CO doesn't exist, create it cleanly saving Faculty 10 clicks!
      let co = await CO.findOne({ courseId, code: coCode });
      if (!co) {
        co = await CO.create({ courseId, code: coCode, description: coDescription });
      }

      // 2. Iterate standard Excel row headers and lookup valid PO columns
      for (const key in row) {
        const keyLower = key.trim().toLowerCase();
        
        // Is this column exactly mapped to a system PO? (e.g. key == "PO1")
        if (poCodeMap[keyLower] !== undefined) {
          const poId = poCodeMap[keyLower];
          const rawValue = row[key];
          const value = parseInt(rawValue) || 0;
          
          if (value >= 0 && value <= 3) {
            await Mapping.findOneAndUpdate(
              { coId: co._id, poId: poId },
              { value: value },
              { upsert: true, new: true }
            );
            processedCount++;
          }
        }
      }
    }
    revalidatePath("/dashboard/co-po-mapping");
    return { success: true, message: `Successfully generated matrix parsing ${processedCount} valid cell weights!` };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateCourseSyllabus(courseId: string, syllabus: string) {
  await dbConnect();
  try {
    await Course.findByIdAndUpdate(courseId, { syllabus });
    revalidatePath("/dashboard/course-file");
    revalidatePath("/dashboard/mcq");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateCourseExtras(courseId: string, extras: any) {
  await dbConnect();
  try {
    await Course.findByIdAndUpdate(courseId, { $set: extras });
    revalidatePath("/dashboard/course-file");
    revalidatePath("/dashboard/mcq");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getCompleteCourseFileData(courseId: string) {
  await dbConnect();
  const { generateCourseReportData } = await import("./report-actions");
  
  await import("@/models/Department");
  const course = await Course.findById(courseId).populate("departmentId").lean();
  if (!course) throw new Error("Course not found");
  
  const reportData = await generateCourseReportData(courseId);
  const students = await Student.find({ courseId }).sort({ registerNumber: 1 }).lean();
  
  const Marks = (await import("@/models/Marks")).default;
  const marks = await Marks.find({ courseId }).lean();
  
  const AssessmentUpload = (await import("@/models/AssessmentUpload")).default;
  const mst1Upload = await AssessmentUpload.findOne({ courseId, examType: 'mst1' }).lean();
  const mst2Upload = await AssessmentUpload.findOne({ courseId, examType: 'mst2' }).lean();
  const endsemUpload = await AssessmentUpload.findOne({ courseId, examType: 'end_semester' }).lean();
  
  return JSON.parse(JSON.stringify({
    course,
    reportData,
    students,
    marks,
    mst1Upload,
    mst2Upload,
    endsemUpload
  }));
}


export async function generateCoursePlanAction(courseId: string, syllabusText: string, totalLectures: number = 40) {
  const upperText = syllabusText.toUpperCase();
  const textBooksIdx = upperText.indexOf('TEXT BOOKS');
  const refBooksIdx = upperText.indexOf('REFERENCE BOOKS');
  
  let endIdx = syllabusText.length;
  if (textBooksIdx !== -1 && refBooksIdx !== -1) {
    endIdx = Math.min(textBooksIdx, refBooksIdx);
  } else if (textBooksIdx !== -1) {
    endIdx = textBooksIdx;
  } else if (refBooksIdx !== -1) {
    endIdx = refBooksIdx;
  }
  
  const parsedSyllabusForPrompt = syllabusText.substring(0, endIdx).trim();

  const prompt = `
You are an academic planner.

Generate a lecture plan in JSON format.

Total lectures: ${totalLectures}

Syllabus:
${parsedSyllabusForPrompt}

Rules:
1. Divide lectures across units proportionally
2. Break syllabus into small teachable topics
3. Combine small topics if needed
4. Each lecture must have:
   - lecture_no
   - unit
   - topic
5. Lecture numbers must be continuous
6. Keep topics concise

Return ONLY valid JSON. No explanation.
`;

  try {
    const content = await generateGroqCompletion(prompt, 0.3);
    let plan = JSON.parse(content.trim());
    if (typeof plan === "object" && plan !== null) {
      if (plan.lectures) plan = plan.lectures;
      else if (!Array.isArray(plan)) plan = Object.values(plan)[0];
    }
    
    if (!Array.isArray(plan)) {
      throw new Error("Generated plan is not an array");
    }

    await dbConnect();
    await Course.findByIdAndUpdate(courseId, { lecturePlan: plan });
    revalidatePath("/dashboard/course-file");
    
    return { success: true, plan };
  } catch (error: any) {
    return { error: "Failed to generate course plan: " + error.message };
  }
}

function cleanJsonResponse(content: string) {
  let parsedContent = content.trim();

  if (parsedContent.includes("```")) {
    const fencedParts = parsedContent.split("```");
    parsedContent = fencedParts[1] || fencedParts[0];
    if (parsedContent.toLowerCase().startsWith("json")) {
      parsedContent = parsedContent.substring(4);
    }
  }

  return parsedContent.trim();
}

async function generateGroqCompletion(prompt: string, temperature = 0.3) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing from environment variables.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature,
    }),
  });

  if (!response.ok) {
    throw new Error("API responded with status " + response.status);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("Groq response did not include valid content.");
  }

  return cleanJsonResponse(content);
}

export async function generateMcqsAction(
  courseId: string,
  syllabusText: string,
  unitsText: string,
  mcqCount: number,
  marksPerQuestion: number
) {
  if (!courseId) {
    return { error: "Course is required." };
  }

  if (!syllabusText.trim()) {
    return { error: "Syllabus is required." };
  }

  if (!unitsText.trim()) {
    return { error: "Please enter the units to generate MCQs from." };
  }

  if (mcqCount <= 0 || marksPerQuestion <= 0) {
    return { error: "MCQ count and marks per question must be greater than 0." };
  }

  const prompt = `
You are an expert academic question paper setter.

Generate ${mcqCount} multiple choice questions using ONLY the syllabus content below.

Target units:
${unitsText}

Syllabus:
${syllabusText}

Rules:
1. Generate exactly ${mcqCount} MCQs.
2. Every question must belong to one of the target units listed above.
3. Each question must have exactly 4 options.
4. Only one option should be correct.
5. Keep wording clear, classroom-appropriate, and syllabus-aligned.
6. Avoid duplicate or near-duplicate questions.
7. Each question carries ${marksPerQuestion} mark(s).

Return ONLY valid JSON in this exact shape:
{
  "mcqs": [
    {
      "questionNumber": 1,
      "unit": "Unit 1",
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": "Option A",
      "marks": ${marksPerQuestion}
    }
  ]
}
`;

  try {
    const content = await generateGroqCompletion(prompt, 0.4);
    const parsed = JSON.parse(content);
    const mcqs = Array.isArray(parsed) ? parsed : parsed?.mcqs;

    if (!Array.isArray(mcqs) || mcqs.length === 0) {
      throw new Error("Generated MCQ data is not in the expected format.");
    }

    return {
      success: true,
      mcqs: mcqs.map((mcq: any, index: number) => ({
        questionNumber: Number(mcq.questionNumber) || index + 1,
        unit: String(mcq.unit || "").trim(),
        question: String(mcq.question || "").trim(),
        options: Array.isArray(mcq.options)
          ? mcq.options.map((option: any) => String(option).trim()).slice(0, 4)
          : [],
        correctAnswer: String(mcq.correctAnswer || "").trim(),
        marks: Number(mcq.marks) || marksPerQuestion,
      })),
    };
  } catch (error: any) {
    return { error: "Failed to generate MCQs: " + error.message };
  }
}
