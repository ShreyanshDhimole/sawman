"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";
import { Toaster, toast } from "react-hot-toast";
import { getCOs, getCourseStudents, getFacultyCourses } from "@/actions/faculty-actions";
import { getSavedMarksUpload, processCOMarksBatch, processMarksBatchByQuestions } from "@/actions/marks-actions";

type Course = { _id: string; name: string; code: string };
type CourseOutcome = { _id: string; code: string; description: string };
type StudentRow = { registerNumber: string; name: string };
type QuestionRow = { id: string; name: string; text: string; coId: string; maxScore: string };

const examOptions = [
  { value: "mst1", label: "MST 1" },
  { value: "mst2", label: "MST 2" },
  { value: "assignment", label: "Assignment" },
  { value: "class_work", label: "Class Work" },
  { value: "end_semester", label: "End Semester" },
  { value: "sessional_work", label: "Sessional Work" },
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function getCellValue(row: Record<string, unknown>, candidates: string[]) {
  const normalizedRow = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeKey(key), value])
  );

  for (const key of candidates) {
    const value = normalizedRow[normalizeKey(key)];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function normalizeCoCode(value: string) {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "");
  const numberMatch = normalized.match(/^(?:CO)?0*(\d+)$/);

  if (numberMatch) {
    return `CO${Number(numberMatch[1])}`;
  }

  return normalized;
}

function getMatchingCoId(cos: CourseOutcome[], coCode: string) {
  const normalizedCode = normalizeCoCode(coCode);
  return (
    cos.find((co) => normalizeCoCode(co.code) === normalizedCode)?._id ||
    ""
  );
}

function parseQuestionPaperText(text: string, cos: CourseOutcome[]) {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const questionPattern =
    /(?:^|\s)(\d{1,2})(?:[.)])?\s+(.+?)\s+(CO\s*\d{1,2}|\d{1,2})\s+(\d{1,3})(?=\s+\d{1,2}(?:[.)])?\s+|$)/gi;
  const parsedRows: QuestionRow[] = [];
  const seenQuestions = new Set<string>();

  for (const match of normalizedText.matchAll(questionPattern)) {
    const [, questionNumber, questionText, coCode, maxMarks] = match;
    if (!questionNumber || !questionText || !coCode || !maxMarks) continue;

    const name = `Q${Number(questionNumber)}`;
    if (seenQuestions.has(name)) continue;
    seenQuestions.add(name);

    parsedRows.push({
      id: makeId(),
      name,
      text: questionText.trim(),
      coId: getMatchingCoId(cos, coCode),
      maxScore: String(Number(maxMarks)),
    });
  }

  return parsedRows;
}

export default function MarksUploadWorkspace() {
  const { data: session }: any = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [cos, setCos] = useState<CourseOutcome[]>([]);
  const [courseStudents, setCourseStudents] = useState<StudentRow[]>([]);
  const [activeStudents, setActiveStudents] = useState<StudentRow[]>([]);
  const [assessmentType, setAssessmentType] = useState("mst1");
  const [entryMode, setEntryMode] = useState<"manual" | "csv">("manual");
  const [questionRows, setQuestionRows] = useState<QuestionRow[]>([]);
  const [questionScores, setQuestionScores] = useState<Record<string, Record<string, string>>>({});
  const [coMaxMarks, setCoMaxMarks] = useState<Record<string, string>>({});
  const [coScores, setCoScores] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [parsingQuestionPaper, setParsingQuestionPaper] = useState(false);
  const [savedUploadLoaded, setSavedUploadLoaded] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      getFacultyCourses(session.user.email).then(setCourses);
    }
  }, [session]);

  useEffect(() => {
    if (!selectedCourse) {
      setCos([]);
      setCourseStudents([]);
      setActiveStudents([]);
      setSavedUploadLoaded(false);
      return;
    }

    setSavedUploadLoaded(false);
    Promise.all([getCOs(selectedCourse), getCourseStudents(selectedCourse)]).then(([coData, studentData]) => {
      const mappedStudents = studentData.map((student: any) => ({
        registerNumber: student.registerNumber,
        name: student.name,
      }));

      setCos(coData);
      setCourseStudents(mappedStudents);
      setActiveStudents(mappedStudents);
    });
  }, [selectedCourse]);

  useEffect(() => {
    setSavedUploadLoaded(false);
    setQuestionRows([{ id: makeId(), name: "Q1", text: "", coId: "", maxScore: "" }]);
    setQuestionScores({});
    setCoScores({});
    setActiveStudents(courseStudents);

    const initialMaxMarks: Record<string, string> = {};
    cos.forEach((co) => {
      initialMaxMarks[co._id] = "";
    });
    setCoMaxMarks(initialMaxMarks);
  }, [assessmentType, courseStudents, cos]);

  useEffect(() => {
    if (!selectedCourse || !cos.length) return;

    let cancelled = false;

    getSavedMarksUpload(selectedCourse, assessmentType).then((savedUpload) => {
      if (cancelled) return;

      if (!savedUpload) {
        setSavedUploadLoaded(false);
        return;
      }

      const savedStudents = savedUpload.students?.length ? savedUpload.students : courseStudents;
      setActiveStudents(savedStudents);

      if (savedUpload.mode === "questions") {
        setQuestionRows(
          savedUpload.questionRows?.length
            ? savedUpload.questionRows.map((row: QuestionRow) => ({ ...row, id: makeId() }))
            : [{ id: makeId(), name: "Q1", text: "", coId: "", maxScore: "" }]
        );
        setQuestionScores(savedUpload.questionScores || {});
      }

      if (savedUpload.mode === "co") {
        setCoMaxMarks(savedUpload.coMaxMarks || {});
        setCoScores(savedUpload.coScores || {});
      }

      setSavedUploadLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedCourse, assessmentType, cos, courseStudents]);

  const isQuestionMode = assessmentType === "mst1" || assessmentType === "mst2";

  function updateQuestionRow(id: string, field: keyof QuestionRow, value: string) {
    if (field === "name") {
      const currentRow = questionRows.find((row) => row.id === id);
      const oldName = currentRow?.name;

      if (oldName && oldName !== value) {
        setQuestionScores((current) => {
          const nextScores: Record<string, Record<string, string>> = {};

          Object.entries(current).forEach(([registerNumber, scores]) => {
            nextScores[registerNumber] = { ...scores };
            if (Object.prototype.hasOwnProperty.call(nextScores[registerNumber], oldName)) {
              nextScores[registerNumber][value] = nextScores[registerNumber][oldName];
              delete nextScores[registerNumber][oldName];
            }
          });

          return nextScores;
        });
      }
    }

    setQuestionRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }

  async function extractPdfText(file: File) {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.mjs",
      import.meta.url
    ).toString();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const documentTask = pdfjs.getDocument({ data: bytes });
    const pdf = await documentTask.promise;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pageTexts.push(content.items.map((item: any) => item.str).join(" "));
    }

    return pageTexts.join(" ");
  }

  async function handleQuestionPaperUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload the question paper as a PDF file.");
      return;
    }

    setParsingQuestionPaper(true);

    try {
      const text = await extractPdfText(file);
      const parsedRows = parseQuestionPaperText(text, cos);

      if (!parsedRows.length) {
        toast.error("No questions found. Please check that the PDF follows Q.No, Questions, CO, Marks format.");
        return;
      }

      setQuestionRows(parsedRows);
      setSavedUploadLoaded(false);
      toast.success(`Fetched ${parsedRows.length} questions from the paper.`);
    } catch (error: any) {
      toast.error(error.message || "Failed to parse the PDF question paper.");
    } finally {
      setParsingQuestionPaper(false);
    }
  }

  function updateQuestionScore(registerNumber: string, questionName: string, value: string) {
    setQuestionScores((current) => ({
      ...current,
      [registerNumber]: {
        ...(current[registerNumber] || {}),
        [questionName]: value,
      },
    }));
  }

  function updateCoScore(registerNumber: string, coId: string, value: string) {
    setCoScores((current) => ({
      ...current,
      [registerNumber]: {
        ...(current[registerNumber] || {}),
        [coId]: value,
      },
    }));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(".mark-input"));
      const index = inputs.indexOf(e.currentTarget);
      if (index > -1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    }
  }

  async function handleQuestionFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      if (!rows.length) {
        toast.error("No rows found in the uploaded file.");
        return;
      }

      const firstRowKeys = Object.keys(rows[0]).map(normalizeKey);
      const isVerticalFormat = firstRowKeys.includes("question") && firstRowKeys.includes("score");
      const parsedStudents = new Map<string, StudentRow>();
      const parsedScores: Record<string, Record<string, string>> = {};

      if (isVerticalFormat) {
        const questionMap = new Map<string, QuestionRow>();

        rows.forEach((row) => {
          const registerNumber = String(
            getCellValue(row, ["register number", "roll no", "regno", "register no"]) ?? ""
          ).trim();
          const name = String(getCellValue(row, ["name", "student name"]) ?? "").trim();
          const question = String(getCellValue(row, ["question", "q"]) ?? "").trim();
          const coCode = String(getCellValue(row, ["co", "course outcome"]) ?? "").trim();
          const maxMarks = String(getCellValue(row, ["max marks", "max", "maximum marks"]) ?? "").trim();
          const score = String(getCellValue(row, ["score", "marks", "marks obtained"]) ?? "").trim();

          if (!registerNumber || !question) return;

          parsedStudents.set(registerNumber, { registerNumber, name: name || registerNumber });
          parsedScores[registerNumber] = {
            ...(parsedScores[registerNumber] || {}),
            [question]: score,
          };

          if (!questionMap.has(question)) {
            questionMap.set(question, {
              id: makeId(),
              name: question,
              text: "",
              coId: getMatchingCoId(cos, coCode),
              maxScore: maxMarks,
            });
          }
        });

        setQuestionRows(Array.from(questionMap.values()));
      } else {
        const questionColumns = Object.keys(rows[0]).filter((key) => {
          const normalized = normalizeKey(key);
          return !["register number", "roll no", "regno", "register no", "name", "student name"].includes(normalized);
        });

        const mappedQuestions = questionColumns.map((column) => ({
          id: makeId(),
          name: column,
          text: "",
          coId: "",
          maxScore: "",
        }));

        rows.forEach((row) => {
          const registerNumber = String(
            getCellValue(row, ["register number", "roll no", "regno", "register no"]) ?? ""
          ).trim();
          const name = String(getCellValue(row, ["name", "student name"]) ?? "").trim();
          if (!registerNumber) return;

          parsedStudents.set(registerNumber, { registerNumber, name: name || registerNumber });
          questionColumns.forEach((column) => {
            parsedScores[registerNumber] = {
              ...(parsedScores[registerNumber] || {}),
              [column]: String(row[column] ?? ""),
            };
          });
        });

        setQuestionRows(mappedQuestions);
      }

      setActiveStudents(Array.from(parsedStudents.values()));
      setQuestionScores(parsedScores);
      setSavedUploadLoaded(false);
      toast.success("Question-based marks imported. Please verify CO mapping and max marks.");
    } catch (error: any) {
      toast.error(error.message || "Failed to parse the uploaded file.");
    }
  }

  async function handleCoFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      if (!rows.length) {
        toast.error("No rows found in the uploaded file.");
        return;
      }

      const parsedStudents = new Map<string, StudentRow>();
      const parsedScores: Record<string, Record<string, string>> = {};
      const nextMaxMarks: Record<string, string> = { ...coMaxMarks };

      rows.forEach((row) => {
        const registerNumber = String(
          getCellValue(row, ["register number", "roll no", "regno", "register no"]) ?? ""
        ).trim();
        const name = String(getCellValue(row, ["name", "student name"]) ?? "").trim();

        if (!registerNumber) return;
        parsedStudents.set(registerNumber, { registerNumber, name: name || registerNumber });

        cos.forEach((co) => {
          const score = getCellValue(row, [co.code]);
          const max = getCellValue(row, [`${co.code} max`, `${co.code} maximum`, `${co.code} total`]);

          if (score !== undefined) {
            parsedScores[registerNumber] = {
              ...(parsedScores[registerNumber] || {}),
              [co._id]: String(score),
            };
          }

          if (max !== undefined && String(max).trim() !== "") {
            nextMaxMarks[co._id] = String(max);
          }
        });
      });

      setActiveStudents(Array.from(parsedStudents.values()));
      setCoScores(parsedScores);
      setCoMaxMarks(nextMaxMarks);
      setSavedUploadLoaded(false);
      toast.success("CO-based marks imported. Please verify max marks before saving.");
    } catch (error: any) {
      toast.error(error.message || "Failed to parse the uploaded file.");
    }
  }

  async function handleSubmit() {
    if (!selectedCourse) {
      toast.error("Select a course first.");
      return;
    }

    if (!activeStudents.length) {
      toast.error("No students available. Upload student list first or import a marks file.");
      return;
    }

    setSaving(true);

    try {
      if (isQuestionMode) {
        const questionConfig: Record<string, { coId: string; maxScore: number }> = {};

        for (const row of questionRows) {
          if (!row.name.trim()) throw new Error("Every question needs a label.");
          if (!row.coId) throw new Error(`Map ${row.name} to a CO before saving.`);
          if (!(Number(row.maxScore) > 0)) throw new Error(`Add valid max marks for ${row.name}.`);
          questionConfig[row.name] = { coId: row.coId, maxScore: Number(row.maxScore) };
        }

        const records = activeStudents.map((student) => ({
          registerNumber: student.registerNumber,
          name: student.name,
          qScores: questionRows.reduce<Record<string, number>>((accumulator, row) => {
            accumulator[row.name] = Number(questionScores[student.registerNumber]?.[row.name] || 0);
            return accumulator;
          }, {}),
        }));

        const result = await processMarksBatchByQuestions(selectedCourse, assessmentType, questionConfig, records, {
          students: activeStudents,
          questionRows: questionRows.map(({ name, text, coId, maxScore }) => ({ name, text, coId, maxScore })),
          questionScores,
        });
        if (result.success) {
          setSavedUploadLoaded(true);
          toast.success(result.message as string);
        } else {
          toast.error(result.error || "Failed to save marks.");
        }
      } else {
        const filteredMaxMarks = Object.fromEntries(
          Object.entries(coMaxMarks)
            .filter(([, value]) => Number(value) > 0)
            .map(([coId, value]) => [coId, Number(value)])
        );

        if (!Object.keys(filteredMaxMarks).length) {
          throw new Error("Enter at least one CO maximum mark.");
        }

        const records = activeStudents.map((student) => ({
          registerNumber: student.registerNumber,
          name: student.name,
          coScores: Object.keys(filteredMaxMarks).reduce<Record<string, number>>((accumulator, coId) => {
            accumulator[coId] = Number(coScores[student.registerNumber]?.[coId] || 0);
            return accumulator;
          }, {}),
        }));

        const result = await processCOMarksBatch(
          selectedCourse,
          assessmentType as "assignment" | "end_semester" | "class_work" | "sessional_work",
          filteredMaxMarks,
          records,
          {
            students: activeStudents,
            coMaxMarks,
            coScores,
          }
        );

        if (result.success) {
          setSavedUploadLoaded(true);
          toast.success(result.message as string);
        } else {
          toast.error(result.error || "Failed to save marks.");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Unable to save marks.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Toaster position="top-center" />

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Faculty Marks Upload</h1>
        <p className="text-sm text-gray-500 mt-2">
          MST 1 and MST 2 are uploaded question-wise. Assignment, Class Work, End Semester, and Sessional Work are uploaded directly CO-wise.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-gray-200 rounded-xl p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2" value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)}>
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>{course.name} ({course.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assessment</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2" value={assessmentType} onChange={(event) => setAssessmentType(event.target.value)}>
            {examOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Entry mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setEntryMode("manual")} className={`rounded-lg border px-3 py-2 text-sm font-medium ${entryMode === "manual" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600"}`}>Manual</button>
            <button type="button" onClick={() => setEntryMode("csv")} className={`rounded-lg border px-3 py-2 text-sm font-medium ${entryMode === "csv" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600"}`}>CSV / Excel</button>
          </div>
        </div>
      </div>

      {selectedCourse ? (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
              <h2 className="text-lg font-semibold text-gray-900">{isQuestionMode ? "Question to CO setup" : "CO-wise marks setup"}</h2>
                <p className="text-sm text-gray-500">
                  {savedUploadLoaded
                    ? "Saved marks were loaded. You can edit them and save again."
                    : isQuestionMode
                      ? "Configure each question with its CO and maximum marks."
                      : "Enter maximum marks for each CO, then fill student marks."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {isQuestionMode && (
                  <label className={`inline-flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 ${parsingQuestionPaper ? "opacity-60 cursor-not-allowed" : ""}`}>
                    {parsingQuestionPaper ? "Reading PDF..." : "Upload question paper PDF"}
                    <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleQuestionPaperUpload} disabled={parsingQuestionPaper} />
                  </label>
                )}

                {entryMode === "csv" && (
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                    Upload {isQuestionMode ? "marks" : "CO-wise marks"} file
                    <input type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={isQuestionMode ? handleQuestionFileUpload : handleCoFileUpload} />
                  </label>
                )}
              </div>
            </div>

            {isQuestionMode ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Question no.</th>
                        <th className="px-3 py-2 text-left">Question</th>
                        <th className="px-3 py-2 text-left">CO</th>
                        <th className="px-3 py-2 text-left">Max marks</th>
                        <th className="px-3 py-2 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questionRows.map((row) => (
                        <tr key={row.id} className="border-t border-gray-200">
                          <td className="px-3 py-2"><input className="w-full rounded border border-gray-300 px-2 py-1" value={row.name} onChange={(event) => updateQuestionRow(row.id, "name", event.target.value)} /></td>
                          <td className="px-3 py-2"><textarea rows={2} className="min-w-80 w-full rounded border border-gray-300 px-2 py-1" value={row.text} onChange={(event) => updateQuestionRow(row.id, "text", event.target.value)} placeholder="Question text" /></td>
                          <td className="px-3 py-2">
                            <select className="w-full rounded border border-gray-300 px-2 py-1" value={row.coId} onChange={(event) => updateQuestionRow(row.id, "coId", event.target.value)}>
                              <option value="">Select CO</option>
                              {cos.map((co) => (
                                <option key={co._id} value={co._id}>{co.code}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2"><input type="text" inputMode="numeric" className="w-full rounded border border-gray-300 px-2 py-1" value={row.maxScore} onChange={(event) => updateQuestionRow(row.id, "maxScore", event.target.value)} /></td>
                          <td className="px-3 py-2">
                            <button type="button" onClick={() => setQuestionRows((current) => current.filter((item) => item.id !== row.id))} className="text-sm font-medium text-red-600" disabled={questionRows.length === 1}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button type="button" onClick={() => setQuestionRows((current) => [...current, { id: makeId(), name: `Q${current.length + 1}`, text: "", coId: "", maxScore: "" }])} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700">Add question</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      {cos.map((co) => (
                        <th key={co._id} className="px-3 py-2 text-left">
                          <div className="font-semibold text-gray-900">{co.code}</div>
                          <input type="text" inputMode="numeric" placeholder="Max" className="mt-2 w-24 rounded border border-gray-300 px-2 py-1 font-normal" value={coMaxMarks[co._id] || ""} onChange={(event) => setCoMaxMarks((current) => ({ ...current, [co._id]: event.target.value }))} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Student marks table</h2>
              <p className="text-sm text-gray-500">{activeStudents.length} students ready for upload.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Roll No</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    {isQuestionMode ? questionRows.map((row) => <th key={row.id} className="px-3 py-2 text-left">{row.name || "Question"}</th>) : cos.map((co) => <th key={co._id} className="px-3 py-2 text-left">{co.code}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {activeStudents.map((student) => (
                    <tr key={student.registerNumber} className="border-t border-gray-200">
                      <td className="px-3 py-2 font-medium text-gray-900">{student.registerNumber}</td>
                      <td className="px-3 py-2 text-gray-700">{student.name}</td>
                      {isQuestionMode ? questionRows.map((row) => (
                        <td key={row.id} className="px-3 py-2">
                          <input type="text" inputMode="numeric" className="mark-input w-24 rounded border border-gray-300 px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none" value={questionScores[student.registerNumber]?.[row.name] || ""} onChange={(event) => updateQuestionScore(student.registerNumber, row.name, event.target.value)} onKeyDown={handleKeyDown} />
                        </td>
                      )) : cos.map((co) => (
                        <td key={co._id} className="px-3 py-2">
                          <input type="text" inputMode="numeric" className="mark-input w-24 rounded border border-gray-300 px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none" value={coScores[student.registerNumber]?.[co._id] || ""} onChange={(event) => updateCoScore(student.registerNumber, co._id, event.target.value)} onKeyDown={handleKeyDown} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={handleSubmit} disabled={saving} className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? "Saving..." : "Save marks"}</button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          Select a course to start uploading marks.
        </div>
      )}
    </div>
  );
}
