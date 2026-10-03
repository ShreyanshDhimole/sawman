"use client";

import { useEffect, useState } from "react";
import { getAdminDashboardStats } from "@/actions/dashboard-actions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  FaUsers,
  FaBook,
  FaChalkboardTeacher,
  FaBuilding,
} from "react-icons/fa";

const STATUS_CONFIG = {
  complete: {
    label: "Complete",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  not_started: {
    label: "Not Started",
    color: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
};

const EXAM_LABELS: Record<string, string> = {
  mst1: "MST-1",
  mst2: "MST-2",
  assignment: "Assignment",
  end_semester: "End Sem",
};

export default function AdminDashboard() {
  // Animated counter utility
  function useCountUp(target: number, duration = 800) {
    const [count, setCount] = useState(0);
    useEffect(() => {
      let start = 0;
      if (target === 0) return setCount(0);
      const step = Math.ceil(target / (duration / 16));
      const interval = setInterval(() => {
        start += step;
        if (start >= target) {
          setCount(target);
          clearInterval(interval);
        } else {
          setCount(start);
        }
      }, 16);
      return () => clearInterval(interval);
    }, [target, duration]);
    return count;
  }
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  // Always call hooks and calculations at the top level
  const deptCount = useCountUp(stats?.deptCount || 0);
  const courseCount = useCountUp(stats?.courseCount || 0);
  const facultyCount = useCountUp(stats?.facultyCount || 0);
  const studentCount = useCountUp(stats?.studentCount || 0);

  const departmentChartData =
    stats?.departmentChartData?.map((d: any) => ({
      ...d,
      studentsPerCourse: d.courses > 0 ? Math.round(d.students / d.courses) : 0,
    })) || [];

  const pieData = [
    { name: "Complete", value: stats?.completedCourses || 0, color: "#10B981" },
    {
      name: "In Progress",
      value: stats?.inProgressCourses || 0,
      color: "#F59E0B",
    },
    {
      name: "Not Started",
      value: stats?.notStartedCourses || 0,
      color: "#EF4444",
    },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
          <div className="text-gray-400 text-sm font-medium">
            Loading institution analytics...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Hero Section ── */}
      <div className="relative rounded-2xl overflow-hidden mb-2 shadow-lg bg-gradient-to-br from-indigo-100 via-white to-teal-100 p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2">
            Welcome, Admin!
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Here’s a  overview of your institution’s progress and
            activity. Manage and track your academic achievements!
          </p>
        </div>
        <div className="flex-1 flex justify-end">
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
          
            <defs>
              <radialGradient
                id="paint0_radial"
                cx="0"
                cy="0"
                r="1"
                gradientTransform="translate(60 60) scale(60)"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#06B6D4" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* ── Row 1: Quick Stats Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl shadow-lg flex items-center gap-4 border border-slate-100">
          <div className="text-3xl text-indigo-500">
            <FaBuilding />
          </div>
          <div>
            <p className="text-teal-400 text-xs font-medium uppercase tracking-wider">
              Departments
            </p>
            <p className="text-3xl font-black mt-1">{deptCount}</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl shadow-lg flex items-center gap-4 border border-slate-100">
          <div className="text-3xl text-blue-500">
            <FaBook />
          </div>
          <div>
            <p className="text-teal-400 text-xs font-medium uppercase tracking-wider">
              Active Courses
            </p>
            <p className="text-3xl font-black mt-1">{courseCount}</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl shadow-lg flex items-center gap-4 border border-slate-100">
          <div className="text-3xl text-emerald-500">
            <FaChalkboardTeacher />
          </div>
          <div>
            <p className="text-teal-400 text-xs font-medium uppercase tracking-wider">
              Faculty
            </p>
            <p className="text-3xl font-black mt-1">{facultyCount}</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl shadow-lg flex items-center gap-4 border border-slate-100">
          <div className="text-3xl text-fuchsia-500">
            <FaUsers />
          </div>
          <div>
            <p className="text-teal-400 text-xs font-medium uppercase tracking-wider">
              Students
            </p>
            <p className="text-3xl font-black mt-1">{studentCount}</p>
          </div>
        </div>
      </div>

      {/* ── Row 2: Completion Overview + Department Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Donut */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
            Course Completion Status
          </h3>
          {stats.courseCount > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-40 h-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 flex-1 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-gray-600">Complete</span>
                  <span className="ml-auto text-sm font-bold text-gray-900">
                    {stats.completedCourses}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="ml-auto text-sm font-bold text-gray-900">
                    {stats.inProgressCourses}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-600">Not Started</span>
                  <span className="ml-auto text-sm font-bold text-gray-900">
                    {stats.notStartedCourses}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500">Completion Rate</div>
                  <div className="text-lg font-black text-gray-900">
                    {stats.courseCount > 0
                      ? Math.round(
                          (stats.completedCourses / stats.courseCount) * 100,
                        )
                      : 0}
                    %
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400">
              No courses created yet.
            </div>
          )}
        </div>

        {/* Department Breakdown Bar Chart (Students per Course) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
            Department-Wise Overview (Students per Course)
          </h3>
          {departmentChartData.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentChartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F3F4F6"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "Students/Course",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 12,
                      fill: "#888",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "none",
                      boxShadow: "0 4px 20px rgb(0 0 0 / 0.08)",
                      fontSize: "12px",
                    }}
                    formatter={(value: any, name: any) => [
                      `${value}`,
                      "Students/Course",
                    ]}
                  />
                  <Bar
                    dataKey="studentsPerCourse"
                    name="Students/Course"
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-lg border border-dashed">
              No department data available.
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Action Needed Alerts ── */}
      {(stats.pendingMarksCourses > 0 || stats.pendingMappingCourses > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.pendingMarksCourses > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                ⚠️
              </div>
              <div>
                <h4 className="text-sm font-bold text-orange-900">
                  Marks Not Uploaded
                </h4>
                <p className="text-xs text-orange-700 mt-0.5">
                  <span className="font-bold text-orange-900">
                    {stats.pendingMarksCourses}
                  </span>{" "}
                  course(s) have no marks uploaded by faculty yet
                </p>
              </div>
            </div>
          )}
          {stats.pendingMappingCourses > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                🔗
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-900">
                  CO-PO Mapping Pending
                </h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  <span className="font-bold text-blue-900">
                    {stats.pendingMappingCourses}
                  </span>{" "}
                  course(s) need CO-PO matrix mapping
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Row 4: Course-by-Course Status Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Course Workflow Tracker
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Real-time progress of each course through the accreditation
              pipeline
            </p>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
            {stats.courseDetails.length} courses
          </span>
        </div>

        {stats.courseDetails.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Faculty
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    COs
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Marks
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    CO-PO Map
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.courseDetails.map((course: any) => {
                  const sc =
                    STATUS_CONFIG[course.status as keyof typeof STATUS_CONFIG];
                  return (
                    <tr
                      key={course._id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">
                          {course.code}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {course.name}
                        </div>
                        {course.academicYear && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {course.session} {course.academicYear}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {course.faculty}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-sm font-bold ${course.studentCount > 0 ? "text-gray-900" : "text-gray-300"}`}
                        >
                          {course.studentCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-sm font-bold ${course.coCount > 0 ? "text-gray-900" : "text-gray-300"}`}
                        >
                          {course.coCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {course.marksUploaded ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {course.examTypes.map((et: string) => (
                              <span
                                key={et}
                                className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium"
                              >
                                {EXAM_LABELS[et] || et}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {course.mappingDone ? (
                          <span className="text-emerald-600 font-bold text-sm">
                            ✓
                          </span>
                        ) : course.coCount > 0 ? (
                          <span className="text-xs text-amber-600 font-medium">
                            {course.mappedCOs}/{course.coCount}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {course.reportGenerated ? (
                          <span className="text-emerald-600 font-bold text-sm">
                            ✓
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${sc.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                          ></span>
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-gray-400 text-sm">
              No courses have been created yet. Go to{" "}
              <span className="font-semibold">Courses</span> to add subjects.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
