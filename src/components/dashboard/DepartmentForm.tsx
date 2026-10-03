"use client";

import { useRef } from "react";
import toast from "react-hot-toast";
import { createDepartment } from "@/actions/admin-actions";

export default function DepartmentForm() {
  const formRef = useRef<HTMLFormElement>(null);

  async function clientAction(formData: FormData) {
    const result = await createDepartment(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Department Created Successfully!");
      formRef.current?.reset();
    }
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Create Department</h2>
      <form ref={formRef} action={clientAction} className="space-y-4">
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
  );
}
