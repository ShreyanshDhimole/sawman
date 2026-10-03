import dbConnect from "@/lib/mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CourseFileManager from "@/components/dashboard/CourseFileManager";
import { getFacultyCourses, getPOs } from "@/actions/faculty-actions";
import Setting from "@/models/Setting";
import { Toaster } from "react-hot-toast";

export const dynamic = "force-dynamic";

export default async function CourseFilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return <div>Access Denied</div>;

  await dbConnect();

  const courses = await getFacultyCourses(session.user.email);
  const pos = await getPOs();
  
  const rawSettings = await Setting.find({}).lean();
  const settings: Record<string, string> = {};
  rawSettings.forEach((s: any) => settings[s.key] = s.value);

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Faculty Course File</h1>

      
      <CourseFileManager courses={courses} settings={settings} pos={pos} facultyName={session.user.name || ""} />
    </div>
  );
}
