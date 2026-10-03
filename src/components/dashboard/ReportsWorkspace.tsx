"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getFacultyCourses } from "@/actions/faculty-actions";
import { generateCourseReportData } from "@/actions/report-actions";

type Course = { _id: string; name: string; code: string; section?: string; session?: string };

function average(values: number[]) {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length).toFixed(2));
}

function formatPoValue(value: number) {
  return Number(value) > 0 ? value : "-";
}

export default function ReportsWorkspace() {
  const { data: session }: any = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [indirectLevels, setIndirectLevels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (session?.user?.email) {
      getFacultyCourses(session.user.email).then(setCourses);
    }
  }, [session]);

  async function fetchReport(saveIndirectLevels = false) {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const parsedIndirectLevels: Record<string, number> = {};
      Object.entries(indirectLevels).forEach(([key, val]) => {
        parsedIndirectLevels[key] = val === "" ? 0 : Number(val) || 0;
      });
      const data = await generateCourseReportData(selectedCourse, parsedIndirectLevels, saveIndirectLevels);
      setReportData(data);

      const nextLevels: Record<string, string> = {};
      data.overallCourseRows.forEach((row: any) => {
        nextLevels[row.coId] = String(row.indirectLevel ?? 0);
      });
      setIndirectLevels(nextLevels);
    } finally {
      setLoading(false);
    }
  }

  function exportExcel() {
    if (!reportData) return;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        reportData.overallCourseRows.map((row: any) => ({
          CO: row.coCode,
          Internal: row.internalLevelAvg,
          "End Term": row.endSemLevelAvg,
          "Attainment Level": row.overallDirectLevel,
        }))
      ),
      "Overall Direct"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        reportData.overallCourseRows.map((row: any) => ({
          CO: row.coCode,
          "Attainment Level": row.indirectLevel,
        }))
      ),
      "Overall Indirect"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        reportData.overallCourseRows.map((row: any) => ({
          CO: row.coCode,
          "Attainment Level": row.finalAttainment,
        }))
      ),
      "Direct + Indirect"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([{ "Overall Course Attainment": reportData.overallCourseAttainment }]),
      "Summary"
    );

    if (reportData.overallPoAttainment?.columns?.length) {
      const poColumns = reportData.overallPoAttainment.columns;
      const poRows = reportData.overallPoAttainment.rows.map((row: any) => ({
        CO: row.coCode,
        ...Object.fromEntries(
          poColumns.map((column: any) => [
            column.poCode,
            formatPoValue(row.values[column.poId]),
          ])
        ),
      }));

      poRows.push({
        CO: "CO Average",
        ...Object.fromEntries(
          poColumns.map((column: any) => [
            column.poCode,
            formatPoValue(reportData.overallPoAttainment.averages[column.poId]),
          ])
        ),
      });

      poRows.push({
        CO: "PO Attainment",
        ...Object.fromEntries(
          poColumns.map((column: any) => [
            column.poCode,
            formatPoValue(reportData.overallPoAttainment.attainment[column.poId]),
          ])
        ),
      });

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(poRows),
        "Overall PO Attainment"
      );
    }

    XLSX.writeFile(workbook, `course-report-${reportData.course.code}.xlsx`);
  }

  function exportPdf() {
    if (!reportData) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${reportData.course.name} (${reportData.course.code})`, 14, 18);
    doc.setFontSize(11);
    doc.text(`Overall Course Attainment: ${reportData.overallCourseAttainment}`, 14, 26);

    autoTable(doc, {
      startY: 34,
      head: [["CO", "Internal", "End Term", "Attainment Level"]],
      body: reportData.overallCourseRows.map((row: any) => [
        row.coCode,
        row.internalLevelAvg,
        row.endSemLevelAvg,
        row.overallDirectLevel,
      ]),
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["CO", "Indirect Attainment Level"]],
      body: reportData.overallCourseRows.map((row: any) => [row.coCode, row.indirectLevel]),
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["CO", "Course Attainment Level"]],
      body: reportData.overallCourseRows.map((row: any) => [row.coCode, row.finalAttainment]),
    });

    if (reportData.overallPoAttainment?.columns?.length) {
      const poColumns = reportData.overallPoAttainment.columns;
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [["CO", ...poColumns.map((column: any) => column.poCode)]],
        body: [
          ...reportData.overallPoAttainment.rows.map((row: any) => [
            row.coCode,
            ...poColumns.map((column: any) => formatPoValue(row.values[column.poId])),
          ]),
          [
            "CO Average",
            ...poColumns.map((column: any) =>
              formatPoValue(reportData.overallPoAttainment.averages[column.poId])
            ),
          ],
          [
            "PO Attainment",
            ...poColumns.map((column: any) =>
              formatPoValue(reportData.overallPoAttainment.attainment[column.poId])
            ),
          ],
        ],
      });
    }

    doc.save(`course-report-${reportData.course.code}.pdf`);
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Faculty Reports</h1>
        <p className="text-sm text-gray-500 mt-2">
          Internal CO attainment, End Semester attainment, and final overall course attainment are generated here.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            value={selectedCourse}
            onChange={(event) => {
              setSelectedCourse(event.target.value);
              setReportData(null);
              setIndirectLevels({});
            }}
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name} ({course.code}){course.section ? ` - Section ${course.section}` : ""}{course.session ? ` (${course.session})` : ""}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => fetchReport(false)}
          disabled={!selectedCourse || loading}
          className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 self-end"
        >
          {loading ? "Generating..." : "Generate report"}
        </button>
      </div>

      {reportData && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {reportData.course.name} ({reportData.course.code}){reportData.course.section ? ` - Section ${reportData.course.section}` : ""}
                </h2>
                <p className="text-sm text-gray-500">
                  Overall Course Attainment: <span className="font-semibold text-slate-900">{reportData.overallCourseAttainment}</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={exportExcel} className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">Export Excel</button>
                <button type="button" onClick={exportPdf} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">Export PDF</button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Indirect CO Attainment Input</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportData.overallCourseRows.map((row: any) => (
                <div key={row.coId} className="rounded-lg border border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-900">{row.coCode}</div>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="mt-3 w-full rounded border border-gray-300 px-3 py-2"
                    value={indirectLevels[row.coId] ?? ""}
                    onChange={(event) => {
                      const val = event.target.value;
                      if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                        setIndirectLevels((current) => ({
                          ...current,
                          [row.coId]: val,
                        }));
                      }
                    }}
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => fetchReport(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Save and recalculate indirect attainment
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <AttainmentTable
              title="Overall Direct Course Attainment"
              columns={["CO", "Internal", "End Term", "Attainment Level"]}
              rows={reportData.overallCourseRows.map((row: any) => [
                row.coCode,
                row.internalLevelAvg,
                row.endSemLevelAvg,
                row.overallDirectLevel,
              ])}
              averageValue={average(reportData.overallCourseRows.map((row: any) => row.overallDirectLevel))}
            />

            <AttainmentTable
              title="Overall Indirect Course Attainment"
              columns={["CO", "Attainment Level"]}
              rows={reportData.overallCourseRows.map((row: any) => [row.coCode, row.indirectLevel])}
              averageValue={average(reportData.overallCourseRows.map((row: any) => row.indirectLevel))}
            />

            <AttainmentTable
              title="Course Attainment (Direct + Indirect)"
              columns={["CO", "Attainment Level"]}
              rows={reportData.overallCourseRows.map((row: any) => [row.coCode, row.finalAttainment])}
              averageValue={reportData.overallCourseAttainment}
            />
          </div>

          <OverallPoAttainmentTable data={reportData.overallPoAttainment} />
        </>
      )}
    </div>
  );
}

function AttainmentTable({
  title,
  columns,
  rows,
  averageValue,
}: {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  averageValue: number;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr>
              <th colSpan={columns.length} className="border border-gray-300 bg-slate-900 px-3 py-2 text-center text-base font-semibold text-white">
                {title}
              </th>
            </tr>
            <tr>
              {columns.map((column) => (
                <th key={column} className="border border-gray-300 bg-gray-50 px-3 py-2 text-center font-medium text-slate-700">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${rowIndex}-${cellIndex}`}
                    className={`border border-gray-300 px-3 py-2 text-center text-slate-700 ${cellIndex === row.length - 1 ? "bg-blue-50 font-semibold text-blue-700" : "bg-white"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td colSpan={columns.length - 1} className="border border-gray-300 bg-blue-50 px-3 py-2 text-center font-semibold text-blue-700">
                Average
              </td>
              <td className="border border-gray-300 bg-blue-50 px-3 py-2 text-center font-semibold text-blue-700">{averageValue}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OverallPoAttainmentTable({ data }: { data: any }) {
  if (!data?.columns?.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-500">
        Overall PO attainment will appear after CO-PO mappings are uploaded for this course.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr>
              <th colSpan={data.columns.length + 1} className="border border-gray-300 bg-slate-900 px-3 py-2 text-center text-base font-semibold text-white">
                Overall PO Attainment
              </th>
            </tr>
            <tr>
              <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-center font-medium text-slate-700">CO</th>
              {data.columns.map((column: any) => (
                <th key={column.poId} className="border border-gray-300 bg-gray-50 px-3 py-2 text-center font-medium text-slate-700" title={column.description}>
                  {column.poCode}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row: any) => (
              <tr key={row.coId}>
                <td className="border border-gray-300 bg-white px-3 py-2 text-center font-semibold text-slate-800">{row.coCode}</td>
                {data.columns.map((column: any) => (
                  <td key={`${row.coId}-${column.poId}`} className="border border-gray-300 bg-white px-3 py-2 text-center text-slate-700">
                    {formatPoValue(row.values[column.poId])}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="border border-gray-300 bg-blue-50 px-3 py-2 text-center font-semibold text-blue-700">CO Average</td>
              {data.columns.map((column: any) => (
                <td key={`avg-${column.poId}`} className="border border-gray-300 bg-blue-50 px-3 py-2 text-center font-semibold text-blue-700">
                  {formatPoValue(data.averages[column.poId])}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-300 bg-blue-100 px-3 py-2 text-center font-semibold text-blue-800">PO Attainment</td>
              {data.columns.map((column: any) => (
                <td key={`attainment-${column.poId}`} className="border border-gray-300 bg-blue-100 px-3 py-2 text-center font-semibold text-blue-800">
                  {formatPoValue(data.attainment[column.poId])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        PO Attainment = (Overall Course Attainment / 3) * CO Average.
      </p>
    </div>
  );
}
