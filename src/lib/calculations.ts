export type StoredMark = {
  studentId: string;
  coId: string;
  examType: "mst1" | "mst2" | "assignment" | "class_work" | "end_semester" | "sessional_work";
  score: number;
  maxScore: number;
};

export type StudentCOAttainment = {
  studentId: string;
  mst1Score: number;
  mst1Max: number;
  mst2Score: number;
  mst2Max: number;
  assignmentScore: number;
  assignmentMax: number;
  classWorkScore: number;
  classWorkMax: number;
  bestMstType: "mst1" | "mst2" | null;
  bestMstScore: number;
  bestMstMax: number;
  totalScore: number;
  totalMax: number;
  percentage: number;
  level: number;
};

export type SingleExamStudentAttainment = {
  studentId: string;
  score: number;
  maxScore: number;
  percentage: number;
  level: number;
};

function roundToTwo(value: number) {
  return Number(value.toFixed(2));
}

function getPercentage(score: number, maxScore: number) {
  if (!maxScore || maxScore <= 0) return 0;
  return (score / maxScore) * 100;
}

export function getAttainmentLevelFromPercentage(percentage: number) {
  if (percentage >= 65) return 3;
  if (percentage >= 50) return 2;
  if (percentage >= 35) return 1;
  return 0;
}

export function pickBestMst(
  mst1?: { score: number; maxScore: number },
  mst2?: { score: number; maxScore: number }
) {
  const first = mst1 ?? { score: 0, maxScore: 0 };
  const second = mst2 ?? { score: 0, maxScore: 0 };
  const firstPercentage = getPercentage(first.score, first.maxScore);
  const secondPercentage = getPercentage(second.score, second.maxScore);

  if (secondPercentage > firstPercentage) {
    return { type: "mst2" as const, ...second };
  }

  if (secondPercentage === firstPercentage && second.score > first.score) {
    return { type: "mst2" as const, ...second };
  }

  if (first.maxScore > 0) {
    return { type: "mst1" as const, ...first };
  }

  if (second.maxScore > 0) {
    return { type: "mst2" as const, ...second };
  }

  return { type: null, score: 0, maxScore: 0 };
}

export function calculateInternalCOAttainment(studentIds: string[], marks: StoredMark[]) {
  const marksByStudent = new Map<string, Partial<Record<StoredMark["examType"], { score: number; maxScore: number }>>>();

  for (const mark of marks) {
    const existing = marksByStudent.get(mark.studentId) ?? {};
    existing[mark.examType] = {
      score: Number(mark.score) || 0,
      maxScore: Number(mark.maxScore) || 0,
    };
    marksByStudent.set(mark.studentId, existing);
  }

  const studentRows: StudentCOAttainment[] = studentIds.map((studentId) => {
    const studentMarks = marksByStudent.get(studentId) ?? {};
    const mst1 = studentMarks.mst1 ?? { score: 0, maxScore: 0 };
    const mst2 = studentMarks.mst2 ?? { score: 0, maxScore: 0 };
    const assignment = studentMarks.assignment ?? { score: 0, maxScore: 0 };
    const classWork = studentMarks.class_work ?? { score: 0, maxScore: 0 };
    const bestMst = pickBestMst(mst1, mst2);
    const totalScore = bestMst.score + assignment.score + classWork.score;
    const totalMax = bestMst.maxScore + assignment.maxScore + classWork.maxScore;
    const percentage = getPercentage(totalScore, totalMax);
    const level = getAttainmentLevelFromPercentage(percentage);

    return {
      studentId,
      mst1Score: mst1.score,
      mst1Max: mst1.maxScore,
      mst2Score: mst2.score,
      mst2Max: mst2.maxScore,
      assignmentScore: assignment.score,
      assignmentMax: assignment.maxScore,
      classWorkScore: classWork.score,
      classWorkMax: classWork.maxScore,
      bestMstType: bestMst.type,
      bestMstScore: bestMst.score,
      bestMstMax: bestMst.maxScore,
      totalScore,
      totalMax,
      percentage: roundToTwo(percentage),
      level,
    };
  });

  const studentCount = studentRows.length;
  const avgPercentage = studentCount
    ? roundToTwo(studentRows.reduce((sum, row) => sum + row.percentage, 0) / studentCount)
    : 0;
  const avgLevel = studentCount
    ? roundToTwo(studentRows.reduce((sum, row) => sum + row.level, 0) / studentCount)
    : 0;

  return {
    studentCount,
    avgPercentage,
    avgLevel,
    studentRows,
  };
}

export function calculateEndSemCOAttainment(studentIds: string[], marks: StoredMark[]) {
  const marksByStudent = new Map<string, Partial<Record<StoredMark["examType"], { score: number; maxScore: number }>>>();

  for (const mark of marks) {
    const existing = marksByStudent.get(mark.studentId) ?? {};
    existing[mark.examType] = {
      score: Number(mark.score) || 0,
      maxScore: Number(mark.maxScore) || 0,
    };
    marksByStudent.set(mark.studentId, existing);
  }

  const studentRows: SingleExamStudentAttainment[] = studentIds.map((studentId) => {
    const studentMarks = marksByStudent.get(studentId) ?? {};
    const endSem = studentMarks.end_semester ?? { score: 0, maxScore: 0 };
    const sessional = studentMarks.sessional_work ?? { score: 0, maxScore: 0 };
    const totalScore = endSem.score + sessional.score;
    const totalMax = endSem.maxScore + sessional.maxScore;
    const percentage = getPercentage(totalScore, totalMax);
    return {
      studentId,
      score: totalScore,
      maxScore: totalMax,
      percentage: roundToTwo(percentage),
      level: getAttainmentLevelFromPercentage(percentage),
    };
  });

  const studentCount = studentRows.length;
  const avgPercentage = studentCount
    ? roundToTwo(studentRows.reduce((sum, row) => sum + row.percentage, 0) / studentCount)
    : 0;
  const avgLevel = studentCount
    ? roundToTwo(studentRows.reduce((sum, row) => sum + row.level, 0) / studentCount)
    : 0;

  return {
    studentCount,
    avgPercentage,
    avgLevel,
    studentRows,
  };
}

export function calculateOverallDirectAttainment(endSemLevel: number, internalLevel: number) {
  return roundToTwo((endSemLevel * 0.7) + (internalLevel * 0.3));
}

export function calculateFinalCourseAttainment(overallDirectLevel: number, indirectLevel: number) {
  return roundToTwo((overallDirectLevel * 0.8) + (indirectLevel * 0.2));
}

export function calculateAverageAttainment(values: number[]) {
  if (!values.length) return 0;
  return roundToTwo(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function calculatePOAttainment(
  coAttainments: Record<string, number>,
  coPoMappings: { coId: string; poId: string; value: number }[]
) {
  const poStats: Record<string, { weightedSum: number; totalWeight: number }> = {};

  for (const mapping of coPoMappings) {
    if (!mapping.value) continue;

    if (!poStats[mapping.poId]) {
      poStats[mapping.poId] = { weightedSum: 0, totalWeight: 0 };
    }

    poStats[mapping.poId].weightedSum += (coAttainments[mapping.coId] || 0) * mapping.value;
    poStats[mapping.poId].totalWeight += mapping.value;
  }

  const result: Record<string, number> = {};

  for (const poId of Object.keys(poStats)) {
    const { weightedSum, totalWeight } = poStats[poId];
    result[poId] = totalWeight ? roundToTwo(weightedSum / totalWeight) : 0;
  }

  return result;
}
