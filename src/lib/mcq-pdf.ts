import jsPDF from "jspdf";

type GeneratedMcq = {
  questionNumber: number;
  unit: string;
  question: string;
  options: string[];
  correctAnswer: string;
  marks: number;
};

type CourseDetails = {
  name?: string;
  code?: string;
  semester?: string;
  section?: string;
  session?: string;
};

const COLLEGE_NAME = "Shri G.S. Institute of Technology & Science, Indore";

function addFirstPageHeader(doc: jsPDF, course: CourseDetails, title: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(COLLEGE_NAME, 105, 18, { align: "center" });

  doc.setFontSize(14);
  doc.text(title, 105, 28, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Course: ${course.name || "-"}`, 14, 40);
  doc.text(`Course Code: ${course.code || "-"}`, 14, 47);
  doc.text(`Semester: ${course.semester || course.section || "-"}`, 14, 54);
  if (course.session) {
    doc.text(`Session: ${course.session}`, 14, 61);
  }

  doc.setLineWidth(0.3);
  doc.line(14, 67, 196, 67);
}

function ensurePageSpace(doc: jsPDF, y: number, requiredHeight: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + requiredHeight > pageHeight - 15) {
    doc.addPage();
    return 20;
  }
  return y;
}

function downloadPdf(doc: jsPDF, fileName: string) {
  doc.save(fileName);
}

function renderMcqPaperSection(doc: jsPDF, mcqs: GeneratedMcq[]) {
  let y = 78;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  mcqs.forEach((mcq) => {
    const questionLines = doc.splitTextToSize(
      `Q${mcq.questionNumber}. ${mcq.question} (${mcq.marks} mark${mcq.marks > 1 ? "s" : ""})`,
      178
    );
    const optionLines = mcq.options.map((option, index) =>
      doc.splitTextToSize(`${String.fromCharCode(65 + index)}. ${option}`, 170)
    );
    const blockHeight =
      questionLines.length * 6 +
      optionLines.reduce((sum, lines) => sum + lines.length * 6, 0) +
      14;

    y = ensurePageSpace(doc, y, blockHeight);

    doc.setFont("helvetica", "bold");
    doc.text(questionLines, 14, y);
    y += questionLines.length * 6 + 2;

    doc.setFont("helvetica", "normal");
    optionLines.forEach((lines) => {
      doc.text(lines, 20, y);
      y += lines.length * 6;
    });

    y += 6;
  });
}

function renderAnswerKeySection(doc: jsPDF, mcqs: GeneratedMcq[]) {
  let y = 82;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  mcqs.forEach((mcq) => {
    const answerOptionIndex = mcq.options.findIndex((option) => option === mcq.correctAnswer);
    const answerLabel = answerOptionIndex >= 0 ? String.fromCharCode(65 + answerOptionIndex) : "-";
    const answerText = mcq.correctAnswer?.trim() || "Answer not available";
    const lines = doc.splitTextToSize(
      `${mcq.questionNumber}. ${answerLabel} (${answerText})`,
      178
    );

    y = ensurePageSpace(doc, y, lines.length * 7 + 8);
    doc.text(lines, 14, y);
    y += lines.length * 7 + 8;
  });
}

export function downloadMcqPdf(course: CourseDetails, mcqs: GeneratedMcq[]) {
  const doc = new jsPDF();
  addFirstPageHeader(doc, course, "MCQ Question Paper");
  renderMcqPaperSection(doc, mcqs);

  doc.addPage();
  addFirstPageHeader(doc, course, "MCQ Answer Key");
  renderAnswerKeySection(doc, mcqs);

  downloadPdf(doc, `MCQ_${course.code || "Course"}.pdf`);
}
