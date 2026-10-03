"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, GraduationCap, Upload, FileText, Settings, LogOut, CheckSquare, Menu, X } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === "unauthenticated") {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return <div className="min-h-screen flex items-center justify-center">Redirecting to login...</div>; 
  }
  
  // authenticated

  const role = (session?.user as any)?.role || "faculty";

  const adminLinks = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Departments & Courses", href: "/dashboard/courses", icon: BookOpen },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const facultyLinks = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Course File", href: "/dashboard/course-file", icon: FileText },
    { name: "MCQ Generator", href: "/dashboard/mcq", icon: FileText },
    { name: "CO-PO Mapping", href: "/dashboard/co-po-mapping", icon: CheckSquare },
    { name: "Upload Marks", href: "/dashboard/marks-upload", icon: Upload },
    { name: "Reports", href: "/dashboard/reports", icon: FileText },
  ];

  const links = role === "admin" ? adminLinks : facultyLinks;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 font-bold text-lg tracking-wide">
          <div className="flex items-center">
            <GraduationCap className="mr-3" /> OBE System
          </div>
          <button className="md:hidden text-gray-300 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={clsx(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === link.href ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <link.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="text-sm px-2 text-slate-400">
            <div>{session?.user?.name}</div>
            <div className="text-xs uppercase">{role}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:hidden">
          <div className="font-bold text-lg flex items-center text-slate-900">
            <GraduationCap className="mr-2 text-slate-800" /> OBE System
          </div>
          <button 
            className="p-2 -mr-2 text-slate-600 hover:text-slate-900"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
