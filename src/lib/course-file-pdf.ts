import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFDocument } from 'pdf-lib';

export const downloadCourseFilePdf = async (allData: any, settings: any, pos: any[], facultyName?: string) => {
  const { course, reportData, students, marks } = allData;
  const doc = new jsPDF();
  
  const standardPOs = pos.filter(p => p.type === 'PO' || !p.type);
  const pEOs = pos.filter(p => p.type === 'PEO');
  const pSOs = pos.filter(p => p.type === 'PSO');

  let insertIndexMst = -1;
  let insertIndexEndsem = -1;
  let insertIndexTimeTable = -1;

  const addHeader = (title: string) => {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 15);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Shri G.S. Institute of Technology & Science", 14, 22);
    doc.text(`Course: ${course.name} (${course.code})`, 14, 27);
    doc.line(14, 30, 196, 30);
  };

  const addPage = () => {
    doc.addPage();
  };

  const getPageCount = () => (doc as any).internal.getNumberOfPages();

  // FRONT PAGE (Title Page)
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SHRI G.S. INSTITUTE OF TECHNOLOGY & SCIENCE, INDORE", 105, 40, { align: "center" });
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Department of Information Technology", 105, 50, { align: "center" });
  
  doc.setFontSize(13);
  doc.text(settings.SEMESTER || "B.Tech 3 Year", 105, 60, { align: "center" });
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("COURSE FILE", 105, 80, { align: "center" });
  
  // Course details box
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(0);
  doc.rect(40, 95, 130, 60);
  
  doc.setFont("helvetica", "bold");
  doc.text("Subject Code:", 50, 105);
  doc.setFont("helvetica", "normal");
  doc.text(course.code || "-", 110, 105);
  
  doc.setFont("helvetica", "bold");
  doc.text("Subject Nomenclature:", 50, 115);
  doc.setFont("helvetica", "normal");
  doc.text(course.name || "-", 110, 115);
  
  doc.setFont("helvetica", "bold");
  doc.text("Session:", 50, 125);
  doc.setFont("helvetica", "normal");
  doc.text(course.session || settings.SESSION || "Jan - May", 110, 125);
  
  doc.setFont("helvetica", "bold");
  doc.text("Semester:", 50, 135);
  doc.setFont("helvetica", "normal");
  doc.text(settings.SEMESTER_LABEL || 'SEM "A"', 110, 135);
  
  doc.setFont("helvetica", "bold");
  doc.text("Faculty:", 50, 145);
  doc.setFont("helvetica", "normal");
  doc.text(facultyName || "Course Instructor", 110, 145);

  // TABLE OF CONTENTS (Index Page)
  addPage();
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("TABLE OF CONTENTS", 14, 20);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const tableOfContents = [
    "1. Vision and Mission of Institute & Department",
    "2. Program Outcome (PO)",
    "3. Program Specific Outcome & Program Education Objectives",
    "4. Syllabus with Course Outcomes (COs)",
    "4a. CO-PO Mapping Matrix",
    "5. Time Table",
    "6. Lecture Plan",
    "7. Attendance of Students",
    "8. Mid Term Test Papers",
    "9. Mid Term Evaluation",
    "10. Class / Lab Assignment",
    "11. End Term Test Paper",
    "12. End Term Evaluation",
    "13. Course Outcome (CO) Attainment",
    "14. CO-PO Attainment Matrix"
  ];
  
  let yPosition = 30;
  tableOfContents.forEach((item) => {
    doc.text(item, 20, yPosition);
    yPosition += 8;
  });

  // 1. Vision and Mission
  addPage();
  addHeader("1. Vision and Mission of Institute & Department");
  doc.setFont("helvetica", "bold");
  doc.text("Institute Vision", 14, 40);
  doc.setFont("helvetica", "normal");
  doc.text(doc.splitTextToSize(settings.VISION_INSTITUTE || "-", 180), 14, 46);
  
  doc.setFont("helvetica", "bold");
  doc.text("Institute Mission", 14, 70);
  doc.setFont("helvetica", "normal");
  doc.text(doc.splitTextToSize(settings.MISSION_INSTITUTE || "-", 180), 14, 76);

  doc.setFont("helvetica", "bold");
  doc.text("Department Vision", 14, 100);
  doc.setFont("helvetica", "normal");
  doc.text(doc.splitTextToSize(settings.VISION_DEPT || "-", 180), 14, 106);
  
  doc.setFont("helvetica", "bold");
  doc.text("Department Mission", 14, 130);
  doc.setFont("helvetica", "normal");
  doc.text(doc.splitTextToSize(settings.MISSION_DEPT || "-", 180), 14, 136);

  // 2. Program Outcome (PO)
  addPage();
  addHeader("2. Program Outcome (PO)");
  autoTable(doc, {
    startY: 35,
    head: [['Code', 'Description']],
    body: standardPOs.map(po => [po.code, po.description]),
    styles: { fontSize: 11 },
  });

  // 3. PEO and PSO
  addPage();
  addHeader("3. Program Specific Outcome & Program Education Objectives");
  doc.setFont("helvetica", "bold");
  doc.text("Program Specific Outcomes (PSO)", 14, 35);
  autoTable(doc, {
    startY: 40,
    head: [['Code', 'Description']],
    body: pSOs.map(pso => [pso.code, pso.description]),
    styles: { fontSize: 11 },
  });
  
  const lastY = (doc as any).lastAutoTable.finalY || 40;
  doc.text("Program Education Objectives (PEO)", 14, lastY + 15);
  autoTable(doc, {
    startY: lastY + 20,
    head: [['Code', 'Description']],
    body: pEOs.map(peo => [peo.code, peo.description]),
    styles: { fontSize: 11 },
  });

  // 4. Syllabus with COs
  addPage();
  addHeader("4. Syllabus with Course Outcomes (COs)");
  doc.setFont("helvetica", "bold");
  doc.text("Syllabus / Course Description", 14, 35);
  doc.setFont("helvetica", "normal");
  doc.text(doc.splitTextToSize(course.syllabus || "No syllabus provided.", 180), 14, 42);

  // 4a. CO-PO Mapping Table (user requested after syllabus)
  if (reportData.overallPoAttainment && reportData.overallPoAttainment.columns && reportData.overallPoAttainment.rows) {
    addPage();
    addHeader("CO-PO Mapping Matrix");
    const heads = [['CO', ...reportData.overallPoAttainment.columns.map((c: any) => c.poCode)]];
    const body = reportData.overallPoAttainment.rows.map((row: any) => [
      row.coCode,
      ...reportData.overallPoAttainment.columns.map((col: any) => row.values[col.poId] || '-')
    ]);
    autoTable(doc, {
      startY: 35,
      head: heads,
      body: body,
      styles: { fontSize: 10 },
    });
  }
  
  // 5. Time Table
  if (course.timeTablePdf?.startsWith("data:application/pdf")) {
    insertIndexTimeTable = getPageCount();
  } else if (course.timeTablePdf?.startsWith("data:image/")) {
    addPage();
    addHeader("5. Time Table");
    try {
      const imgProps = doc.getImageProperties(course.timeTablePdf);
      const maxWidth = 180;
      const maxHeight = 230;
      let renderW = maxWidth;
      let renderH = (imgProps.height * renderW) / imgProps.width;
      if (renderH > maxHeight) {
        renderH = maxHeight;
        renderW = (imgProps.width * renderH) / imgProps.height;
      }
      const posX = 14 + (maxWidth - renderW) / 2;
      doc.addImage(course.timeTablePdf, imgProps.fileType || "JPEG", posX, 35, renderW, renderH);
    } catch (err) {
      console.error("Error embedding timetable image in PDF:", err);
      doc.text("Time table image could not be rendered.", 14, 40);
    }
    insertIndexTimeTable = -1;
  } else {
    addPage();
    addHeader("5. Time Table");
    doc.text("Time table not uploaded as PDF.", 14, 40);
    insertIndexTimeTable = -1;
  }

  // 6. Lecture Plan
  addPage();
  addHeader("6. Lecture Plan");
  if (course.lecturePlan && Array.isArray(course.lecturePlan)) {
    autoTable(doc, {
      startY: 35,
      head: [['Lecture No', 'Unit', 'Topic']],
      body: course.lecturePlan.map((lp: any) => [lp.lecture_no || '-', lp.unit || '-', lp.topic || '-']),
      styles: { fontSize: 11 },
    });
  } else {
    doc.text("Lecture Plan not generated.", 14, 40);
  }

  // 7. Attendance
  addPage();
  addHeader("7. Attendance of Students");
  if (course.attendance && Array.isArray(course.attendance) && course.attendance.length > 0) {
    const headFields = Object.keys(course.attendance[0]);
    autoTable(doc, {
      startY: 35,
      head: [headFields],
      body: course.attendance.map((row: any) => headFields.map(field => row[field])),
      styles: { fontSize: 11 },
    });
  } else {
    doc.text("Attendance not uploaded.", 14, 40);
  }

  // 8. Mid Term Test Papers
  if (course.mst1Paper?.startsWith("data:application/pdf") || course.mst2Paper?.startsWith("data:application/pdf")) {
    insertIndexMst = getPageCount();
  } else {
    addPage();
    addHeader("8. Mid Term Test Papers");
    doc.text("Not uploaded", 14, 40);
    insertIndexMst = getPageCount();
  }

  // 9. Mid Term Evaluation
  addPage();
  addHeader("9. Mid Term Evaluation");
  
  const allDataAny = allData as any;
  const mst1Upload = allDataAny.mst1Upload;
  const mst2Upload = allDataAny.mst2Upload;

  const renderUploadTable = (upload: any, title: string) => {
    if (!upload || !upload.students || !upload.students.length) return false;
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 40);
    
    if (upload.mode === "questions" && upload.questionRows && upload.questionScores) {
      const qNames = upload.questionRows.map((q: any) => q.name || "Q");
      const head = [['Enrollment No.', 'Name', ...qNames, 'Total']];
      const body = upload.students.map((s: any) => {
        let total = 0;
        const row = [s.registerNumber, s.name];
        upload.questionRows.forEach((q: any) => {
          const scoreStr = upload.questionScores[s.registerNumber]?.[q.name] || "0";
          const score = Number(scoreStr) || 0;
          total += score;
          row.push(scoreStr);
        });
        row.push(total.toString());
        return row;
      });
      autoTable(doc, {
        startY: (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : 45,
        head,
        body,
        styles: { fontSize: 10 },
      });
      return true;
    }
    return false;
  };

  let renderedAnyMst = false;
  if (renderUploadTable(mst1Upload, "MST 1 Evaluation")) renderedAnyMst = true;
  if (renderUploadTable(mst2Upload, "MST 2 Evaluation")) renderedAnyMst = true;

  if (!renderedAnyMst) {
    doc.setFont("helvetica", "normal");
    doc.text("Mid Term Evaluation data not found or not mapped by questions.", 14, 40);
  }

  // 10. Assignments
  addPage();
  addHeader("10. Class / Lab Assignment");
  if (course.assignments && typeof course.assignments === 'string' && course.assignments.trim().length > 0) {
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(course.assignments, 180), 14, 40);
  } else if (course.assignments && Array.isArray(course.assignments) && course.assignments.length > 0) {
    autoTable(doc, {
      startY: 35,
      head: [['Title', 'Description']],
      body: course.assignments.map((a: any) => [a.title || '-', a.description || '-']),
      styles: { fontSize: 11 },
    });
  } else {
    doc.text("No assignments configured.", 14, 40);
  }

  // 11. End Term Test Paper
  if (course.endsemPaper?.startsWith("data:application/pdf")) {
    insertIndexEndsem = getPageCount();
  } else {
    addPage();
    addHeader("11. End Term Test Paper");
    doc.text("Not uploaded", 14, 40);
    insertIndexEndsem = getPageCount();
  }

  // 12. End Term Evaluation
  addPage();
  addHeader("12. End Term Evaluation");
  const endsemUpload = allDataAny.endsemUpload;
  
  if (endsemUpload && endsemUpload.students && endsemUpload.students.length && reportData.overallCourseRows) {
    // Collect CO codes from report data to map columns
    const coMap = new Map<string, string>();
    reportData.overallCourseRows.forEach((r: any) => {
      coMap.set(r.coId, r.coCode);
    });
    
    // We know End Sem usually uses 'co' mode
    if (endsemUpload.mode === "co" && endsemUpload.coScores) {
      const coIds = Object.keys(endsemUpload.coMaxMarks || {});
      const head = [['Enrollment No.', 'Name', ...coIds.map(id => coMap.get(id) || id), 'Total Marks']];
      
      const body = endsemUpload.students.map((s: any) => {
        let total = 0;
        const row = [s.registerNumber, s.name];
        coIds.forEach(id => {
          const scoreStr = endsemUpload.coScores[s.registerNumber]?.[id] || "0";
          const score = Number(scoreStr) || 0;
          total += score;
          row.push(scoreStr);
        });
        row.push(total.toString());
        return row;
      });
      
      autoTable(doc, {
        startY: 35,
        head,
        body,
        styles: { fontSize: 8 },
      });
    } else if (endsemUpload.mode === "questions" && endsemUpload.questionRows) {
      // Fallback if they used question mode for End Sem
      renderUploadTable(endsemUpload, "End Semester Marks Distribution");
    } else {
      doc.text("End Semester Evaluation data not properly formatted.", 14, 40);
    }
  } else {
    doc.text("End Term Evaluation data not found.", 14, 40);
  }

  // 13. CO Attainment
  addPage();
  addHeader("13. Course Outcome (CO) Attainment");

  if (reportData.overallCourseRows && reportData.overallCourseRows.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Direct & Indirect Overall CO Attainment", 14, 40);
    autoTable(doc, {
      startY: 45,
      head: [['CO Code', 'Description', 'Internal Level', 'EndSem Level', 'Direct Level', 'Indirect Level', 'Final Attainment']],
      body: reportData.overallCourseRows.map((r: any) => [
        r.coCode,
        r.description,
        r.internalLevelAvg?.toFixed(2) || '-',
        r.endSemLevelAvg?.toFixed(2) || '-',
        r.overallDirectLevel?.toFixed(2) || '-',
        r.indirectLevel?.toFixed(2) || '-',
        r.finalAttainment?.toFixed(2) || '-'
      ]),
      styles: { fontSize: 10 },
    });
  } else {
    doc.text("CO Attainment not generated.", 14, 40);
  }

  // 14. CO-PO Attainment
  addPage();
  addHeader("14. CO-PO Attainment Matrix");
  if (reportData.overallPoAttainment && reportData.overallPoAttainment.columns) {
    const cols = reportData.overallPoAttainment.columns;
    const bodyRows = reportData.overallPoAttainment.rows.map((row: any) => {
      const arr = [row.coCode];
      cols.forEach((col: any) => {
        arr.push(row.values[col.poId]?.toString() || '-');
      });
      return arr;
    });
    
    // add averages
    const avgArr = ["Average"];
    cols.forEach((col: any) => {
      avgArr.push(reportData.overallPoAttainment.averages[col.poId]?.toString() || '-');
    });
    bodyRows.push(avgArr);
    
    // add attainment
    const attArr = ["Final PO Attainment"];
    cols.forEach((col: any) => {
      attArr.push(reportData.overallPoAttainment.attainment[col.poId]?.toString() || '-');
    });
    bodyRows.push(attArr);

    const head = ['CO Code', ...cols.map((c: any) => c.poCode)];
    
    autoTable(doc, {
      startY: 35,
      head: [head],
      body: bodyRows,
      styles: { fontSize: 10 },
    });
  } else {
    doc.text("CO-PO Attainment logic/matrix not generated.", 14, 40);
  }

  const jsPdfBytes = doc.output('arraybuffer');
  let mergedPdf = await PDFDocument.load(jsPdfBytes);

  const loadPdfFromDataUrl = async (dataUrl: string) => {
    try {
      const b64 = dataUrl.split(',')[1];
      const binaryStr = atob(b64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return await PDFDocument.load(bytes, { ignoreEncryption: true });
    } catch (e) {
      console.error("Error loading PDF from data URL", e);
      return null;
    }
  };

  // Insert backwards so indices don't shift: EndSem (late), Mst, then TimeTable (early)
  if (course.endsemPaper?.startsWith("data:application/pdf")) {
    const endSemDoc = await loadPdfFromDataUrl(course.endsemPaper);
    if (endSemDoc) {
      const copiedPages = await mergedPdf.copyPages(endSemDoc, endSemDoc.getPageIndices());
      for (let i = 0; i < copiedPages.length; i++) {
          mergedPdf.insertPage(insertIndexEndsem + i, copiedPages[i]);
      }
    }
  }

  if (course.mst2Paper?.startsWith("data:application/pdf") || course.mst1Paper?.startsWith("data:application/pdf")) {
    let mstPages: any[] = [];
    if (course.mst1Paper?.startsWith("data:application/pdf")) {
      const mst1Doc = await loadPdfFromDataUrl(course.mst1Paper);
      if (mst1Doc) {
        const copiedMst1 = await mergedPdf.copyPages(mst1Doc, mst1Doc.getPageIndices());
        mstPages.push(...copiedMst1);
      }
    }
    if (course.mst2Paper?.startsWith("data:application/pdf")) {
      const mst2Doc = await loadPdfFromDataUrl(course.mst2Paper);
      if (mst2Doc) {
        const copiedMst2 = await mergedPdf.copyPages(mst2Doc, mst2Doc.getPageIndices());
        mstPages.push(...copiedMst2);
      }
    }
    
    for (let i = 0; i < mstPages.length; i++) {
        mergedPdf.insertPage(insertIndexMst + i, mstPages[i]);
    }
  }

  if (insertIndexTimeTable !== -1 && course.timeTablePdf?.startsWith("data:application/pdf")) {
    const ttDoc = await loadPdfFromDataUrl(course.timeTablePdf);
    if (ttDoc) {
      const copiedPages = await mergedPdf.copyPages(ttDoc, ttDoc.getPageIndices());
      for (let i = 0; i < copiedPages.length; i++) {
          mergedPdf.insertPage(insertIndexTimeTable + i, copiedPages[i]);
      }
    } else {
      console.warn("Could not load timetable PDF, inserting fallback notice page.");
      const fallbackPage = mergedPdf.insertPage(insertIndexTimeTable);
      fallbackPage.drawText("5. Time Table: Failed to load uploaded PDF file.", { x: 50, y: 750, size: 12 });
    }
  }

  const pdfBytes = await mergedPdf.save();
  const pdfArrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
  new Uint8Array(pdfArrayBuffer).set(pdfBytes);
  const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CourseFile_${course.code}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
