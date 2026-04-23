import { getDepartments, getFaculty, createDepartment, createCourse, createFaculty } from "@/actions/admin-actions";
import Course from "@/models/Course";
import dbConnect from "@/lib/mongoose";
import CourseForm from "@/components/dashboard/CourseForm";
import ExportFacultyLoad from "@/components/dashboard/ExportFacultyLoad";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  await dbConnect();
  const departments = await getDepartments();
  const faculty = await getFaculty();

  async function submitDepartment(formData: FormData) {
    "use server";
    await createDepartment(formData);
  }

  async function submitFaculty(formData: FormData) {
    "use server";
    await createFaculty(formData);
  }
  
  const coursesRaw = await Course.find({})
    .populate("departmentId")
    .populate("facultyId")
    .lean();
  const courses = JSON.parse(JSON.stringify(coursesRaw));

  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold text-gray-900">System Administration Hub</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      
        {/* Create Department Form */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Create Department</h2>
          <form action={submitDepartment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
              <input type="text" name="name" required className="w-full px-4 py-2 border rounded focus:ring-blue-500" placeholder="Computer Science" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
              <input type="text" name="code" required className="w-full px-4 py-2 border rounded focus:ring-blue-500" placeholder="CSE" />
            </div>
            <button type="submit" className="w-full py-2 bg-slate-900 text-white font-medium rounded hover:bg-slate-800 transition">Save Department</button>
          </form>
        </section>

  {/* Create Faculty Form (New) */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Add Faculty</h2>
          <form action={submitFaculty} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" name="name" required className="w-full px-4 py-2 border rounded focus:ring-blue-500" placeholder="shiva khanna" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" required className="w-full px-4 py-2 border rounded focus:ring-blue-500" placeholder="faculty@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Password</label>
              <input type="password" name="password" required className="w-full px-4 py-2 border rounded focus:ring-blue-500" placeholder="password123" />
            </div>
            <button type="submit" className="w-full py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition">Register Faculty</button>
          </form>
        </section>

        {/* Create Course Form */}
        <CourseForm departments={departments} faculty={faculty} />
      </div>

      
      {/* Grouped Courses List */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Faculty Assignments</h2>
            <p className="text-sm text-gray-500 mt-1">Manage what subjects each faculty is currently teaching.</p>
          </div>
          <div className="flex gap-4 items-center">
            <ExportFacultyLoad faculty={faculty} courses={courses} />
            <span className="text-sm font-medium px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
              Total Faculty: {faculty.length}
            </span>
          </div>
        </div>

        {faculty.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
            No faculty members defined yet. Add some faculty to begin!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {faculty.map((fac: any) => {
              const facCourses = courses.filter((c: any) => c.facultyId?._id === fac._id);
              
              return (
                <div key={fac._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                        {fac.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{fac.name}</h3>
                        <p className="text-xs text-gray-500">{fac.email}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100">
                      {facCourses.length} Assigned Course{facCourses.length !== 1 && 's'}
                    </span>
                  </div>
                  
                  {facCourses.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acad. Year</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year & Program</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sem & Sec</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                          {facCourses.map((c: any) => (
                            <tr key={c._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.session || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.academicYear || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                Yr {c.year || '-'} • {c.program || 'B.Tech'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {c.semester ? `${c.semester} Sem` : '-'} • Sec {c.section || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{c.code}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.departmentId?.name || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-6 py-8 text-center text-sm text-gray-400 bg-gray-50/50">
                      No subjects have been assigned to {fac.name} yet.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
