"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
// We will use recharts dynamically to avoid SSR issues
import dynamic from "next/dynamic";

const FacultyDashboard = dynamic(() => import("@/components/dashboard/FacultyDashboard"), { ssr: false });
const AdminDashboard = dynamic(() => import("@/components/dashboard/AdminDashboard"), { ssr: false });

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  if (!role) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      {role === "admin" ? <AdminDashboard /> : <FacultyDashboard />}
    </div>
  );
}
