"use client";

import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { updateCourseSyllabus, generateCoursePlanAction, updateCourseExtras, getCompleteCourseFileData } from "@/actions/faculty-actions";
import { downloadCourseFilePdf } from "@/lib/course-file-pdf";
import { getFaculty } from "@/actions/admin-actions";

export default function CourseFileManager({ courses, settings, pos }: { courses: any[], settings: Record<string, string>, pos: any[] }) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [syllabusText, setSyllabusText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [totalLectures, setTotalLectures] = useState(40);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [lecturePlan, setLecturePlan] = useState<any[] | null>(null);

  // New states for extra attributes
  const [mst1Paper, setMst1Paper] = useState("");
  const [mst2Paper, setMst2Paper] = useState("");
  const [endsemPaper, setEndsemPaper] = useState("");
  const [assignments, setAssignments] = useState("");
  const [timeTablePdf, setTimeTablePdf] = useState("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const selectedCourse = useMemo(() => courses.find(c => c._id === selectedCourseId), [courses, selectedCourseId]);

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = e.target.value;
    setSelectedCourseId(cid);
    if (!cid) {
      setSyllabusText("");
      return;
    }
    const c = courses.find(course => course._id === cid);
    setSyllabusText(c?.syllabus || "");
    setLecturePlan(c?.lecturePlan || null);
    
    setMst1Paper(c?.mst1Paper || "");
    setMst2Paper(c?.mst2Paper || "");
    setEndsemPaper(c?.endsemPaper || "");
    setAssignments(typeof c?.assignments === "string" ? c.assignments : "");
    setTimeTablePdf(c?.timeTablePdf || "");
    setAttendance(c?.attendance || []);
  };

  const getFaculty=()=>{
    
  }
  const handleSaveSyllabus = async () => {
    if (!selectedCourseId) return;
    setIsSaving(true);
    const res = await updateCourseSyllabus(selectedCourseId, syllabusText);
    if (res.success) {
      toast.success("Syllabus updated successfully");
      const c = courses.find(course => course._id === selectedCourseId);
      if (c) c.syllabus = syllabusText; // optimistic update
    } else {
      toast.error(res.error || "Error saving syllabus");
    }
    setIsSaving(false);
  };

  const handleSaveExtras = async () => {
    if (!selectedCourseId) return;
    setIsSaving(true);
    const extras = { mst1Paper, mst2Paper, endsemPaper, assignments, attendance, timeTablePdf };
    const res = await updateCourseExtras(selectedCourseId, extras);
    if (res.success) {
      toast.success("Course File components saved successfully");
      const c = courses.find(course => course._id === selectedCourseId);
      if (c) {
        c.mst1Paper = mst1Paper;
        c.mst2Paper = mst2Paper;
        c.endsemPaper = endsemPaper;
        c.assignments = assignments;
        c.timeTablePdf = timeTablePdf;
        c.attendance = attendance;
      }
    } else {
      toast.error(res.error || "Error saving components");
    }
    setIsSaving(false);
  };

  const handleAttendanceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(worksheet);
      setAttendance(rows);
      toast.success(`Loaded ${rows.length} rows of attendance`);
    } catch (e) {
      toast.error("Failed to parse CSV/Excel file");
    }
  };

  const handleDownloadPdf = async () => {
    if(!selectedCourseId) return;
    setIsGeneratingPdf(true);
    const toastId = toast.loading("Assembling complete course file PDF...");
    try {
      const allData = await getCompleteCourseFileData(selectedCourseId);
      await downloadCourseFilePdf(allData, settings, pos);
      toast.success("Course File PDF Downloaded!", { id: toastId });
    } catch (e: any) {
      toast.error("Failed to generate PDF: " + e.message, { id: toastId });
    }
    setIsGeneratingPdf(false);
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setter(b64);
      toast.success("PDF loaded successfully.");
    };
    reader.readAsDataURL(file);
  };

  const handleGeneratePlan = async () => {
    if (!selectedCourseId || !syllabusText.trim()) {
      toast.error("Please ensure syllabus is pasted and saved first.");
      return;
    }
    
    setIsGeneratingPlan(true);
    const toastId = toast.loading("Generating AI Course Plan...");
    
    const res = await generateCoursePlanAction(selectedCourseId, syllabusText, totalLectures);
    
    if (res.success && res.plan) {
      toast.success("Course Plan Generated!", { id: toastId });
      setLecturePlan(res.plan);
      const c = courses.find(course => course._id === selectedCourseId);
      if (c) c.lecturePlan = res.plan;
    } else {
      toast.error(res.error || "Failed to generate plan", { id: toastId });
    }
    
    setIsGeneratingPlan(false);
  };

  const standardPOs = pos.filter(p => p.type === 'PO' || !p.type);
  const pEOs = pos.filter(p => p.type === 'PEO');
  const pSOs = pos.filter(p => p.type === 'PSO');

  const parseIndexTable = (text: string) => {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim().length > 0);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:hidden">
        <label className="block text-sm font-bold text-gray-800 mb-2">Select Assigned Subject for Course File</label>
        <select 
          className="w-full md:w-1/3 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900"
          value={selectedCourseId}
          onChange={handleCourseChange}
        >
          <option value="">-- Choose Subject --</option>
          {courses.map(c => (
             <option key={c._id} value={c._id}>{c.name} ({c.code}) - {c.session}</option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <>
          <div className="bg-white text-gray-900 p-8 rounded-lg shadow-md border-t-8 border-slate-900 text-center space-y-2">
             <h1 className="text-xl font-bold uppercase tracking-wider">Shri G.S. Institute of Technology & Science, Indore</h1>
             <h2 className="text-lg font-semibold text-gray-700">Department of Information Technology</h2>
             <p className="font-semibold text-gray-600">
               {selectedCourse.program || "B.Tech."} {selectedCourse.year ? `${selectedCourse.year} Year` : ""} Semester {selectedCourse.semester || "V"}
             </p>
             <h3 className="text-2xl font-black mt-4 underline underline-offset-4 mb-8">COURSE FILE</h3>
             
             <div className="text-left max-w-2xl mx-auto space-y-1 font-medium bg-gray-50 p-6 rounded border border-gray-200 mt-6 mt-8">
                <p><span className="font-bold w-48 inline-block">Subject Code:</span> {selectedCourse.code}</p>
                <p><span className="font-bold w-48 inline-block">Subject Nomenclature:</span> {selectedCourse.name}</p>
                <p><span className="font-bold w-48 inline-block">Session:</span> {selectedCourse.session || "N/A"}</p>
                <p><span className="font-bold w-48 inline-block">Semester:</span> SEM “{selectedCourse.section || selectedCourse.semester || "A"}”</p>
                <p><span className="font-bold w-48 inline-block">Faculty:</span> Course Instructor</p>
             </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-2xl font-black mb-6 text-center underline underline-offset-4">INDEX</h3>
            <div className="max-w-3xl mx-auto bg-white border border-gray-300">
               <div className="grid grid-cols-[100px_1fr] bg-gray-100 border-b border-gray-300 font-bold">
                  <div className="p-3 border-r border-gray-300 text-center">Sr. No.</div>
                  <div className="p-3">Contents</div>
               </div>
               {parseIndexTable(settings.INDEX_TABLE).map((item, index) => {
                  const match = item.match(/^(\d+)\.\s*(.*)/);
                  const num = match ? match[1] : index + 1;
                  const text = match ? match[2] : item;
                  return (
                    <div key={index} className="grid grid-cols-[100px_1fr] border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition">
                       <div className="p-3 border-r border-gray-200 text-center font-medium text-gray-600">{num}.</div>
                       <div className="p-3 text-gray-800">{text}</div>
                    </div>
                  );
               })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 text-center text-blue-900">Institute Declarations</h3>
              <div className="space-y-4">
                <div>
                   <h4 className="text-sm font-bold text-gray-700">Vision</h4>
                   <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded mt-1 border border-gray-100">{settings.VISION_INSTITUTE || "Not specified by Admin"}</p>
                </div>
                <div>
                   <h4 className="text-sm font-bold text-gray-700">Mission</h4>
                   <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded mt-1 border border-gray-100">{settings.MISSION_INSTITUTE || "Not specified by Admin"}</p>
                </div>
              </div>
            </section>
            
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 text-center text-blue-900">Department Declarations</h3>
              <div className="space-y-4">
                <div>
                   <h4 className="text-sm font-bold text-gray-700">Vision</h4>
                   <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded mt-1 border border-gray-100">{settings.VISION_DEPT || "Not specified by Admin"}</p>
                </div>
                <div>
                   <h4 className="text-sm font-bold text-gray-700">Mission</h4>
                   <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded mt-1 border border-gray-100">{settings.MISSION_DEPT || "Not specified by Admin"}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Program Educational Objectives (PEOs)</h3>
              {pEOs.length > 0 ? (
                <ul className="space-y-2">
                   {pEOs.map(peo => (
                      <li key={peo._id} className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100 flex gap-3">
                         <span className="font-bold text-teal-700 flex-shrink-0">{peo.code}</span> 
                         <span>{peo.description}</span>
                      </li>
                   ))}
                </ul>
              ) : <p className="text-sm text-gray-400 italic">None configured.</p>}
            </section>

            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Program Specific Outcomes (PSOs)</h3>
              {pSOs.length > 0 ? (
                <ul className="space-y-2">
                   {pSOs.map(pso => (
                      <li key={pso._id} className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100 flex gap-3">
                         <span className="font-bold text-purple-700 flex-shrink-0">{pso.code}</span> 
                         <span>{pso.description}</span>
                      </li>
                   ))}
                </ul>
              ) : <p className="text-sm text-gray-400 italic">None configured.</p>}
            </section>
          </div>

          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-h-[400px] overflow-y-auto">
             <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 sticky top-0 bg-white">Program Outcomes (POs)</h3>
             <div className="space-y-2">
                {standardPOs.map(po => (
                   <div key={po._id} className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100 flex gap-4">
                      <span className="font-bold text-blue-900 flex-shrink-0 w-12">{po.code}</span> 
                      <span>{po.description}</span>
                   </div>
                ))}
             </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-slate-900">
            <div className="flex justify-between items-center mb-4">
               <div>
                 <h3 className="text-xl font-bold text-gray-900">Course Syllabus & Framework Array</h3>
                 <p className="text-xs text-gray-500">Only you can edit this section. The global parameters above belong to Admin.</p>
               </div>
               <button onClick={handleSaveSyllabus} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white font-medium rounded shadow hover:bg-blue-700 transition">
                  {isSaving ? "Saving..." : "Save Syllabus Core"}
               </button>
            </div>
            <textarea
               value={syllabusText}
               onChange={e => setSyllabusText(e.target.value)}
               className="w-full h-64 p-4 border rounded-lg focus:ring-blue-500 bg-gray-50 text-gray-800 text-sm leading-relaxed"
               placeholder="Paste mapping logic, CO array descriptions, chapter unit breakdowns, and reference book literature here..."
            ></textarea>

            <div className="mt-8 border-t border-gray-200 pt-6">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                 <div>
                   <h3 className="text-xl font-bold text-gray-900">AI Lecture Plan Generator</h3>
                   <p className="text-sm text-gray-500">Automatically splits syllabus units into teachable lectures.</p>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                     <label className="text-sm font-semibold text-gray-700">Total Lectures:</label>
                     <input 
                       type="text"
                       inputMode="numeric"
                       value={totalLectures}
                       onChange={e => setTotalLectures(parseInt(e.target.value) || 40)}
                       className="w-20 px-3 py-2 border rounded focus:ring-blue-500 text-gray-900"
                     />
                   </div>
                   <button 
                     onClick={handleGeneratePlan} 
                     disabled={isGeneratingPlan || isSaving} 
                     className="px-6 py-2 bg-indigo-600 text-white font-medium rounded shadow hover:bg-indigo-700 transition disabled:opacity-50"
                   >
                      {isGeneratingPlan ? "Generating..." : "Generate Course Plan"}
                   </button>
                 </div>
               </div>
            </div>
          </section>
          {lecturePlan && lecturePlan.length > 0 && (
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6 max-h-[400px] overflow-y-auto">
               <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 sticky top-0 bg-white">Generated Lecture Plan</h3>
               <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                 <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-slate-50 sticky top-12">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-slate-50">Lecture No</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-slate-50">Unit</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-slate-50">Topic Covered</th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                     {lecturePlan.map((lecture, i) => (
                       <tr key={i} className="hover:bg-gray-50">
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                           {lecture.lecture_no}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                           {lecture.unit}
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-600">
                           {lecture.topic}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </section>
          )}

           <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6 print:hidden space-y-8">
             <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-bold text-gray-900">Additional Course File Components</h3>
                <button onClick={handleSaveExtras} disabled={isSaving} className="px-6 py-2 bg-green-600 text-white font-medium rounded shadow hover:bg-green-700 transition">
                  {isSaving ? "Saving..." : "Save File Components"}
                </button>
             </div>

             <div className="space-y-4">
               <h4 className="text-lg font-bold text-gray-800">5. Time Table (PDF)</h4>
               <input type="file" accept=".pdf,application/pdf" onChange={e => handlePdfUpload(e, setTimeTablePdf)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
               {timeTablePdf?.startsWith("data:application/pdf") && <p className="text-xs text-green-600 mt-1">✓ Time Table PDF Ready</p>}
             </div>

             <div className="space-y-4">
               <h4 className="text-lg font-bold text-gray-800">7. Attendance Upload (CSV/Excel)</h4>
               <input type="file" accept=".csv,.xls,.xlsx" onChange={handleAttendanceUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
               {attendance && attendance.length > 0 && <p className="text-xs text-green-600 mt-1">✓ {attendance.length} records loaded</p>}
             </div>

             <div className="space-y-4">
               <h4 className="text-lg font-bold text-gray-800">8 & 11. Question Papers (PDF)</h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="p-4 border rounded bg-gray-50 flex flex-col gap-2">
                   <label className="block text-sm font-semibold mb-1 text-gray-700">MST 1 Paper</label>
                   <input type="file" accept=".pdf,application/pdf" onChange={e => handlePdfUpload(e, setMst1Paper)} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700" />
                   {mst1Paper?.startsWith("data:application/pdf") ? <p className="text-xs text-green-600 font-medium">✓ PDF Ready</p> : (mst1Paper ? <p className="text-xs text-orange-600 font-medium">Text saved. Please re-upload as PDF.</p> : null)}
                 </div>
                 <div className="p-4 border rounded bg-gray-50 flex flex-col gap-2">
                   <label className="block text-sm font-semibold mb-1 text-gray-700">MST 2 Paper</label>
                   <input type="file" accept=".pdf,application/pdf" onChange={e => handlePdfUpload(e, setMst2Paper)} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700" />
                   {mst2Paper?.startsWith("data:application/pdf") ? <p className="text-xs text-green-600 font-medium">✓ PDF Ready</p> : (mst2Paper ? <p className="text-xs text-orange-600 font-medium">Text saved. Please re-upload as PDF.</p> : null)}
                 </div>
                 <div className="p-4 border rounded bg-gray-50 flex flex-col gap-2">
                   <label className="block text-sm font-semibold mb-1 text-gray-700">End Sem Paper</label>
                   <input type="file" accept=".pdf,application/pdf" onChange={e => handlePdfUpload(e, setEndsemPaper)} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700" />
                   {endsemPaper?.startsWith("data:application/pdf") ? <p className="text-xs text-green-600 font-medium">✓ PDF Ready</p> : (endsemPaper ? <p className="text-xs text-orange-600 font-medium">Text saved. Please re-upload as PDF.</p> : null)}
                 </div>
               </div>
             </div>

             <div className="space-y-4">
               <h4 className="text-lg font-bold text-gray-800">10. Assignments</h4>
               <textarea value={assignments} onChange={e => setAssignments(e.target.value)} className="w-full h-48 p-4 border rounded-lg focus:ring-blue-500 bg-gray-50 text-gray-800 text-sm leading-relaxed" placeholder="Paste all your assignments here..."></textarea>
             </div>
           </section>

           <div className="mt-8 flex justify-center pb-12 print:hidden">
             <button
               onClick={handleDownloadPdf}
               disabled={isGeneratingPdf || isSaving}
               className="px-10 py-5 bg-slate-900 text-white font-black text-lg rounded-xl shadow-lg hover:bg-slate-800 transition flex items-center gap-3 disabled:opacity-50"
             >
               {isGeneratingPdf ? "Assembling PDF..." : "📥 DOWNLOAD COMPLETE COURSE FILE PDF"}
             </button>
           </div>
        </>
      )}
    </div>
  );
}
