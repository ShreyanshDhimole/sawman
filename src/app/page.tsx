"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl w-full text-center space-y-8 animate-in fade-in duration-700">
        <div className="mx-auto bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center shadow-sm">
            <GraduationCap className="h-12 w-12 text-blue-600" />
        </div>
        
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
          OBE Accreditation System
        </h1>
        
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Manage Course Outcomes, Program Outcomes, and student performance metrics seamlessly for NBA Accreditation compliances.
        </p>
        
        <div className="pt-8 flex justify-center gap-4">
          <Link 
            href="/login"
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 hover:shadow-lg transition-all"
          >
            Access Portal
          </Link>
          <Link 
            href="/dashboard"
            className="px-8 py-3 bg-white text-slate-700 border border-slate-200 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
