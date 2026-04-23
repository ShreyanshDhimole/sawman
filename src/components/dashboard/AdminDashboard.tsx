"use client";

import { useEffect, useState } from "react";
import { getAdminDashboardStats } from "@/actions/dashboard-actions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboardStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg font-medium animate-pulse">Loading institution analytics...</div>
      </div>
    );
  }

  const getBarColor = (value: number) => {
    if (value >= 70) return "#10B981";
    if (value >= 50) return "#3B82F6";
    if (value >= 30) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Departments</h3>
          <p className="text-3xl font-bold mt-2 text-gray-800">{stats.deptCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Active Courses</h3>
          <p className="text-3xl font-bold mt-2 text-gray-800">{stats.courseCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Total Faculty</h3>
          <p className="text-3xl font-bold mt-2 text-gray-800">{stats.facultyCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Students Tracked</h3>
          <p className="text-3xl font-bold mt-2 text-gray-800">{stats.studentCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Overall Attainment</h3>
          <p className={`text-3xl font-bold mt-2 ${stats.overallAvg >= 50 ? 'text-green-600' : stats.overallAvg > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
            {stats.overallAvg > 0 ? `${stats.overallAvg}%` : "N/A"}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6 text-gray-900">Institution-Wide PO Attainment Distribution</h3>
        {stats.poChartData && stats.poChartData.some((d: any) => d.attainment > 0) ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.poChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${Number(value || 0).toFixed(1)}%`, 'Attainment']}
                />
                <Bar dataKey="attainment" radius={[6, 6, 0, 0]} barSize={36}>
                  {stats.poChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.attainment)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-400 text-sm font-medium">No attainment data computed yet. Faculty must upload marks and map COs first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
