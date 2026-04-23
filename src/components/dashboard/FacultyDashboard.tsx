"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getFacultyDashboardStats } from "@/actions/dashboard-actions";
import StudentUpload from "@/components/dashboard/StudentUpload";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

export default function FacultyDashboard() {
  const { data: session }: any = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourseIdx, setSelectedCourseIdx] = useState(0);

  useEffect(() => {
    if (session?.user?.email) {
      getFacultyDashboardStats(session.user.email).then(data => {
        setStats(data);
        setLoading(false);
      });
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg font-medium animate-pulse">Loading your course analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-red-500">Could not load dashboard data.</div>;
  }

  const activeCourse = stats.courseAttainments?.[selectedCourseIdx];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Assigned Courses</h3>
          <p className="text-3xl font-bold mt-2 text-gray-800">{stats.courseCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Assessments Pending</h3>
          <p className={`text-3xl font-bold mt-2 ${stats.pendingCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {stats.pendingCount}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Average CO Level</h3>
          <p className={`text-3xl font-bold mt-2 ${stats.avgAttainment >= 2 ? 'text-green-600' : stats.avgAttainment > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
            {stats.avgAttainment > 0 ? `${stats.avgAttainment} / 3` : "N/A"}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        {stats.courseAttainments && stats.courseAttainments.length > 0 ? (
          <>
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Course Administration</h3>
                {activeCourse && (
                   <p className="text-sm text-gray-500 mt-1">
                     {activeCourse.program || 'B.Tech'} • Year {activeCourse.year || 'N/A'} • {activeCourse.session || 'Unknown Session'}
                   </p>
                )}
              </div>
              <select
                className="px-3 py-2 border rounded text-sm font-medium focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={selectedCourseIdx}
                onChange={(e) => setSelectedCourseIdx(Number(e.target.value))}
              >
                {stats.courseAttainments.map((c: any, i: number) => (
                  <option key={c.courseId} value={i}>{c.courseName} ({c.courseCode})</option>
                ))}
              </select>
            </div>
            
            {activeCourse && (
              <>
                <StudentUpload courseId={activeCourse.courseId} courseName={activeCourse.courseName} />
                
                {activeCourse.students && activeCourse.students.length > 0 && (
                  <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <h4 className="text-sm font-semibold text-gray-800">Registered Students ({activeCourse.students.length})</h4>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-white sticky top-0 shadow-sm">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {activeCourse.students.map((student: any) => (
                            <tr key={student._id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-900 font-medium whitespace-nowrap">{student.registerNumber}</td>
                              <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{student.name}</td>
                              <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{student.email || '-'}</td>
                              <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{student.contactNo || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div className="mt-8 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">CO Attainment Breakdown</h3>
            </div>

            {activeCourse && activeCourse.coRows.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeCourse.coRows} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="coCode" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }}/>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`${Number(value || 0).toFixed(1)}%`]}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="avgPercentage" name="Internal Avg %" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={36} />
                    <Bar dataKey="attainmentLevelScaled" name="CO Level Avg (scaled)" fill="#93C5FD" radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-400 text-sm font-medium">No COs or marks uploaded for this course yet.</p>
              </div>
            )}
          </>
        ) : (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-400 text-sm font-medium">No courses assigned to your account yet. Contact your Admin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
