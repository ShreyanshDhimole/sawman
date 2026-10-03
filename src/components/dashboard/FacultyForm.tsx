"use client";

import { useRef } from "react";
import toast from "react-hot-toast";
import { createFaculty } from "@/actions/admin-actions";

export default function FacultyForm() {
  const formRef = useRef<HTMLFormElement>(null);

  async function clientAction(formData: FormData) {
    const result = await createFaculty(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Faculty Created Successfully!");
      formRef.current?.reset();
    }
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Add Faculty</h2>
      <form ref={formRef} action={clientAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input type="text" name="name" required className="w-full px-4 py-2 border rounded focus:ring-blue-500" placeholder="e.g. Shiva Khanna" />
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
  );
}
