import dbConnect from "@/lib/mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getFacultyCourses } from "@/actions/faculty-actions";
import MCQGeneratorManager from "@/components/dashboard/MCQGeneratorManager";
import { Toaster } from "react-hot-toast";

export const dynamic = "force-dynamic";

export default async function McqPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return <div>Access Denied</div>;

  await dbConnect();

  const courses = await getFacultyCourses(session.user.email);

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold text-gray-900 mb-8">MCQ Generator</h1>
      <MCQGeneratorManager courses={courses} />
    </div>
  );
}
