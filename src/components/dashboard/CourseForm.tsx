"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createCourse } from "@/actions/admin-actions";

export default function CourseForm({ departments, faculty }: { departments: any[], faculty: any[] }) {
  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}-${(currentYear + 1).toString().slice(2)}`;
  
  const [session, setSession] = useState("");
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
  const [program, setProgram] = useState("B.Tech");
  const [departmentId, setDepartmentId] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");

  // Generate academic year options: 5 years back + 3 years forward
  const academicYearOptions = Array.from({ length: 9 }, (_, i) => {
    const y = currentYear - 5 + i;
    return `${y}-${(y + 1).toString().slice(2)}`;
  });

  const isFormCascaded = session && academicYear && program && departmentId && year && semester && section;

  async function clientAction(formData: FormData) {
    if (!isFormCascaded) return;
    formData.append("session", session);
    formData.append("academicYear", academicYear);
    formData.append("program", program);
    formData.append("departmentId", departmentId);
    formData.append("year", year);
    formData.append("semester", semester);
    formData.append("section", section);

    const result = await createCourse(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Course Created Successfully!");
    }
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Add Subject (Course)</h2>
      
      {/* Cascading Selection */}
      <div className="space-y-4 mb-6 border-b pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
            <select value={session} onChange={e => setSession(e.target.value)} className="w-full px-4 py-2 border rounded focus:ring-blue-500">
              <option value="">-- Select Session --</option>
              <option value="Jan - June">Jan - June</option>
              <option value="July - Dec">July - Dec</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full px-4 py-2 border rounded focus:ring-blue-500">
              {academicYearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        
        {session && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select value={program} onChange={e => setProgram(e.target.value)} className="w-full px-4 py-2 border rounded focus:ring-blue-500">
              <option value="B.Tech">B.Tech</option>
              <option value="M.Tech">M.Tech</option>
              <option value="MCA">MCA</option>
            </select>
          </div>
        )}

        {session && program && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className="w-full px-4 py-2 border rounded focus:ring-blue-500">
              <option value="">-- Choose Dept --</option>
              {departments.map((d: any) => (
                <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
        )}

        {session && program && departmentId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select value={year} onChange={e => setYear(e.target.value)} className="w-full px-4 py-2 border rounded focus:ring-blue-500">
              <option value="">-- Choose Year --</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
        )}

        {session && program && departmentId && year && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select value={semester} onChange={e => setSemester(e.target.value)} className="w-full px-4 py-2 border rounded focus:ring-blue-500">
                <option value="">-- Semester --</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}{s === 1 ? 'st' : s === 2 ? 'nd' : s === 3 ? 'rd' : 'th'} Sem</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select value={section} onChange={e => setSection(e.target.value)} className="w-full px-4 py-2 border rounded focus:ring-blue-500">
                <option value="">-- Section --</option>
                {['A','B','Both'].map(s => <option key={s} value={s}>{s === 'Both' ? 'Both (A & B)' : s}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {isFormCascaded ? (
        <form action={clientAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
            <input type="text" name="name" required className="w-full px-4 py-2 border rounded focus:ring-blue-500" placeholder="e.g. Machine Learning" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
            <input type="text" name="code" required className="w-full px-4 py-2 border rounded focus:ring-blue-500" placeholder="e.g. CS601" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Faculty</label>
            <select name="facultyId" required className="w-full px-4 py-2 border rounded focus:ring-blue-500 text-gray-900">
              <option value="">-- Select Faculty --</option>
              {faculty.map((f: any) => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
          </div>
          <button 
            type="submit" 
            className="w-full py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
            disabled={faculty.length === 0}
          >
             {faculty.length === 0 ? "Add Faculty First" : "Save Subject"}
          </button>
        </form>
      ) : (
        <div className="text-center text-sm text-gray-500 py-4 bg-gray-50 border border-dashed rounded">
          Please complete all selections above to assign a subject.
        </div>
      )}
    </section>
  );
}
