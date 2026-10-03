"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { generateMcqsAction, updateCourseSyllabus } from "@/actions/faculty-actions";
import { downloadMcqPdf } from "@/lib/mcq-pdf";

type GeneratedMcq = {
  questionNumber: number;
  unit: string;
  question: string;
  options: string[];
  correctAnswer: string;
  marks: number;
};

export default function MCQGeneratorManager({ courses }: { courses: any[] }) {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [syllabusText, setSyllabusText] = useState("");
  const [unitsText, setUnitsText] = useState("");
  const [mcqCount, setMcqCount] = useState(10);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMcqs, setGeneratedMcqs] = useState<GeneratedMcq[]>([]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course._id === selectedCourseId),
    [courses, selectedCourseId]
  );

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courseId = e.target.value;
    setSelectedCourseId(courseId);

    if (!courseId) {
      setSyllabusText("");
      setGeneratedMcqs([]);
      return;
    }

    const course = courses.find((item) => item._id === courseId);
    setSyllabusText(course?.syllabus || "");
    setGeneratedMcqs([]);
  };

  const handleSaveSyllabus = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a subject first.");
      return;
    }

    setIsSaving(true);
    const res = await updateCourseSyllabus(selectedCourseId, syllabusText);

    if (res.success) {
      const course = courses.find((item) => item._id === selectedCourseId);
      if (course) {
        course.syllabus = syllabusText;
      }
      toast.success("Shared syllabus saved successfully.");
    } else {
      toast.error(res.error || "Failed to save syllabus.");
    }

    setIsSaving(false);
  };

  const handleGenerateMcqs = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a subject first.");
      return;
    }

    if (!syllabusText.trim()) {
      toast.error("Please paste the syllabus first.");
      return;
    }

    if (!unitsText.trim()) {
      toast.error("Please enter the units for MCQ generation.");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Generating MCQs from syllabus...");

    const res = await generateMcqsAction(
      selectedCourseId,
      syllabusText,
      unitsText,
      mcqCount,
      marksPerQuestion
    );

    if (res.success && Array.isArray(res.mcqs)) {
      setGeneratedMcqs(res.mcqs);
      toast.success("MCQs generated successfully.", { id: toastId });
    } else {
      toast.error(res.error || "Failed to generate MCQs.", { id: toastId });
    }

    setIsGenerating(false);
  };

  const handleDownloadPdf = () => {
    if (!selectedCourse || generatedMcqs.length === 0) {
      toast.error("Please generate MCQs first.");
      return;
    }

    downloadMcqPdf(selectedCourse, generatedMcqs);
    toast.success("Combined MCQ PDF downloaded.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <label className="block text-sm font-bold text-gray-800 mb-2">Select Subject for MCQ Generation</label>
        <select
          className="w-full md:w-1/3 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900"
          value={selectedCourseId}
          onChange={handleCourseChange}
        >
          <option value="">-- Choose Subject --</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.name} ({course.code}){course.section ? ` - Section ${course.section}` : ""}{course.session ? ` (${course.session})` : ""}
            </option>
          ))}
        </select>
      </section>

      {selectedCourse && (
        <>
          <section className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-slate-900">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Shared Syllabus Input</h2>
                <p className="text-sm text-gray-500">
                  This syllabus is shared with the Course File page. Save it once and both pages use the same content.
                </p>
              </div>
              <button
                onClick={handleSaveSyllabus}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded shadow hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Shared Syllabus"}
              </button>
            </div>

            <textarea
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              className="w-full h-64 p-4 border rounded-lg focus:ring-blue-500 bg-gray-50 text-gray-800 text-sm leading-relaxed"
              placeholder="Paste the syllabus here. This will stay shared with the Course File page."
            />
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Units</label>
              <input
                type="text"
                value={unitsText}
                onChange={(e) => setUnitsText(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder='Example: Unit 1, Unit 2'
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Number of MCQs</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={mcqCount}
                  onChange={(e) => setMcqCount(Number(e.target.value) || 1)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Marks for Each MCQ</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={marksPerQuestion}
                  onChange={(e) => setMarksPerQuestion(Number(e.target.value) || 1)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateMcqs}
              disabled={isGenerating || isSaving}
              className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg shadow hover:bg-slate-800 transition disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate MCQs"}
            </button>
          </section>

          {generatedMcqs.length > 0 && (
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between gap-4 mb-6 border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Generated MCQs</h3>
                  <p className="text-sm text-gray-500">
                    {generatedMcqs.length} question(s) generated for {selectedCourse.name}.
                  </p>
                </div>
                <button
                  onClick={handleDownloadPdf}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition"
                >
                  Download as PDF
                </button>
              </div>

              <div className="space-y-4">
                {generatedMcqs.map((mcq) => (
                  <article key={mcq.questionNumber} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                      <h4 className="text-base font-bold text-gray-900">
                        Q{mcq.questionNumber}. {mcq.question}
                      </h4>
                      <div className="text-sm text-gray-600 font-medium">
                        <span className="mr-4">{mcq.unit || "Unit not specified"}</span>
                        <span>{mcq.marks} mark(s)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mcq.options.map((option, optionIndex) => {
                        const optionLabel = String.fromCharCode(65 + optionIndex);
                        const isCorrect = option === mcq.correctAnswer;

                        return (
                          <div
                            key={`${mcq.questionNumber}-${optionIndex}`}
                            className={`rounded-lg border px-4 py-3 text-sm ${
                              isCorrect
                                ? "border-green-300 bg-green-50 text-green-800"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            <span className="font-semibold mr-2">{optionLabel}.</span>
                            {option}
                          </div>
                        );
                      })}
                    </div>

                    <p className="mt-4 text-sm font-medium text-green-700">
                      Correct answer: {mcq.correctAnswer}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
