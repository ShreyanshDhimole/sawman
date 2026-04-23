"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DownloadCloud } from "lucide-react";

export default function ExportFacultyLoad({ faculty, courses }: { faculty: any[], courses: any[] }) {
  
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Faculty Load Report", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    let yPos = 40;

    faculty.forEach((fac, index) => {
      const facCourses = courses.filter((c: any) => c.facultyId?._id === fac._id);
      
      // Faculty Header
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102); // Dark blue
      doc.text(`${fac.name}`, 14, yPos);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Email: ${fac.email} | Total Assigned Load: ${facCourses.length} Subjects`, 14, yPos + 6);
      
      yPos += 12;

      if (facCourses.length > 0) {
        const tableColumn = ["Session", "Year / Program", "Sem / Section", "Code", "Subject Name","Department"];
        const tableRows: any[][] = [];

        facCourses.forEach((c: any) => {
           const session = c.session || '-';
           const yrProg = `Yr ${c.year || '-'} / ${c.program || 'B.Tech'}`;
           const semSec = `${c.semester ? c.semester + ' Sem' : '-'} / Sec ${c.section || '-'}`;
           const dept = c.departmentId?.name || '-';
           
           tableRows.push([
             session, yrProg, semSec, c.code, c.name, dept
           ]);
        });

        autoTable(doc, {
          startY: yPos,
          head: [tableColumn],
          body: tableRows,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          margin: { top: 10 }
        });
        
        // @ts-ignore
        yPos = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("No courses assigned yet.", 14, yPos);
        yPos += 10;
      }
      
      // Page break logic if getting near bottom
      if (yPos > 270 && index < faculty.length - 1) {
         doc.addPage();
         yPos = 20;
      }
    });

    doc.save(`Faculty_Load_Report_${new Date().getTime()}.pdf`);
  };

  return (
    <button 
      onClick={handleExportPDF}
      className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 shadow-sm text-white text-sm font-medium rounded hover:bg-slate-800 transition"
    >
      <DownloadCloud size={18} />
      Export Faculty Load (PDF)
    </button>
  );
}
