"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { updateCourse, deleteCourse } from "@/actions/admin-actions";
import { Pencil, Trash2, X, Check, Search } from "lucide-react";

export default function CourseManager({ courses, faculty, departments }: { courses: any[], faculty: any[], departments: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const startEdit = (course: any) => {
    setEditingId(course._id);
    setEditData({
      name: course.name,
      code: course.code,
      facultyId: course.facultyId?._id || course.facultyId,
      session: course.session || "",
      academicYear: course.academicYear || "",
      program: course.program || "B.Tech",
      year: course.year || "",
      semester: course.semester || "",
      section: course.section || "",
      departmentId: course.departmentId?._id || course.departmentId,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleUpdate = async (id: string) => {
    setLoading(true);
    const result = await updateCourse(id, editData);
    if (result.success) {
      toast.success("Course updated successfully!");
      setEditingId(null);
    } else {
      toast.error(result.error || "Failed to update course");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course? All associated data might be lost.")) return;
    setLoading(true);
    const result = await deleteCourse(id);
    if (result.success) {
      toast.success("Course deleted successfully!");
    } else {
      toast.error(result.error || "Failed to delete course");
    }
    setLoading(false);
  };

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.facultyId?.name && c.facultyId.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Manage Courses</h2>
        <div className="relative w-full sm:w-64">
          <input 
            type="text" 
            placeholder="Search courses or faculty..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>
      </div>
      
      {filteredCourses.length === 0 ? (
        <p className="text-gray-500 text-sm">No courses found.</p>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Faculty</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Session / Year</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredCourses.map((course) => (
                <tr key={course._id} className="hover:bg-gray-50">
                  {editingId === course._id ? (
                    <td colSpan={5} className="px-3 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-blue-50/50 p-4 rounded border border-blue-100">
                        <div>
                          <label className="block text-[10px] uppercase text-gray-500 mb-1">Code</label>
                          <input type="text" value={editData.code} onChange={(e) => setEditData({...editData, code: e.target.value})} className="w-full px-2 py-1 border rounded text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-gray-500 mb-1">Name</label>
                          <input type="text" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="w-full px-2 py-1 border rounded text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-gray-500 mb-1">Faculty</label>
                          <select value={editData.facultyId} onChange={(e) => setEditData({...editData, facultyId: e.target.value})} className="w-full px-2 py-1 border rounded text-sm">
                            <option value="">-- Faculty --</option>
                            {faculty.map((f: any) => <option key={f._id} value={f._id}>{f.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-gray-500 mb-1">Department</label>
                          <select value={editData.departmentId} onChange={(e) => setEditData({...editData, departmentId: e.target.value})} className="w-full px-2 py-1 border rounded text-sm">
                            <option value="">-- Dept --</option>
                            {departments.map((d: any) => <option key={d._id} value={d._id}>{d.code}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-gray-500 mb-1">Session</label>
                          <select value={editData.session} onChange={(e) => setEditData({...editData, session: e.target.value})} className="w-full px-2 py-1 border rounded text-sm">
                            <option value="Jan - June">Jan - June</option>
                            <option value="July - Dec">July - Dec</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-gray-500 mb-1">Acad Year</label>
                          <input type="text" value={editData.academicYear} onChange={(e) => setEditData({...editData, academicYear: e.target.value})} className="w-full px-2 py-1 border rounded text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-gray-500 mb-1">Program</label>
                          <select value={editData.program} onChange={(e) => setEditData({...editData, program: e.target.value})} className="w-full px-2 py-1 border rounded text-sm">
                            <option value="B.Tech">B.Tech</option>
                            <option value="M.Tech">M.Tech</option>
                            <option value="MCA">MCA</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-gray-500 mb-1">Year & Sem</label>
                          <div className="flex gap-1">
                            <input type="text" value={editData.year} placeholder="Yr" onChange={(e) => setEditData({...editData, year: e.target.value})} className="w-1/2 px-2 py-1 border rounded text-sm" />
                            <input type="text" value={editData.semester} placeholder="Sem" onChange={(e) => setEditData({...editData, semester: e.target.value})} className="w-1/2 px-2 py-1 border rounded text-sm" />
                          </div>
                        </div>
                        <div className="flex items-end justify-end gap-2">
                           <button onClick={() => handleUpdate(course._id)} disabled={loading} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                             Save
                           </button>
                           <button onClick={cancelEdit} disabled={loading} className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
                             Cancel
                           </button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-3 text-sm font-medium text-gray-900">{course.code}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 truncate max-w-[200px]">{course.name}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{course.facultyId?.name || "Unassigned"}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">
                        {course.session || '-'} • {course.academicYear || '-'}
                      </td>
                      <td className="px-3 py-3 text-center flex justify-center gap-2">
                        <button onClick={() => startEdit(course)} disabled={loading} className="text-blue-500 hover:text-blue-700 p-1">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(course._id)} disabled={loading} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
