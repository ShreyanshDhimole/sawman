"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getFacultyCourses, getCOs, getPOs, getMappings, saveMapping, createCO, uploadMappingBatch } from "@/actions/faculty-actions";
import { toast, Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";

export default function COPoMappingClient() {
  const { data: session }: any = useSession();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [cos, setCos] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [mappingMatrix, setMappingMatrix] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      getFacultyCourses(session.user.email).then(setCourses);
      getPOs().then(setPos); 
    }
  }, [session]);

  const loadMatrixData = (courseId: string) => {
     getCOs(courseId).then(setCos);
     getMappings(courseId).then((mappings: any) => {
        const matrix: any = {};
        mappings.forEach((m: any) => {
          if (!matrix[m.coId]) matrix[m.coId] = {};
          matrix[m.coId][m.poId] = m.value;
        });
        setMappingMatrix(matrix);
     });
  };

  useEffect(() => {
    if (selectedCourse) {
      loadMatrixData(selectedCourse);
    } else {
      setCos([]);
      setMappingMatrix({});
    }
  }, [selectedCourse]);

  const handleMatrixChange = (coId: string, poId: string, val: string) => {
    const value = parseInt(val) || 0;
    setMappingMatrix(prev => ({
      ...prev,
      [coId]: { ...(prev[coId] || {}), [poId]: value }
    }));
  };

  const handleSaveMatrix = async () => {
    setLoading(true);
    const updates: any[] = [];
    Object.keys(mappingMatrix).forEach(coId => {
      Object.keys(mappingMatrix[coId]).forEach(poId => {
        updates.push({ coId, poId, value: mappingMatrix[coId][poId] });
      });
    });

    const res = await saveMapping(selectedCourse, updates);
    if (res.success) {
        toast.success("Manual overrides saved successfully!");
        loadMatrixData(selectedCourse);
    } else toast.error("Error saving matrix");
    
    setLoading(false);
  };

  const handleAddCO = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await createCO(formData);
    if (res.success) {
      toast.success("Course Outcome generated explicitly!");
      loadMatrixData(selectedCourse);
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCourse) {
       toast.error("Please explicitly select a target course first!");
       e.target.value = "";
       return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rawData = XLSX.utils.sheet_to_json(ws);
          
          if (rawData.length === 0) {
              toast.error("Supplied document structurally empty.");
              setIsUploading(false);
              return;
          }

          const response = await uploadMappingBatch(selectedCourse, rawData);
          if (response.success) {
              toast.success(response.message as string);
              // Visually refresh the table arrays instantly
              loadMatrixData(selectedCourse);
          } else {
              toast.error(response.error as string);
          }
      } catch (err: any) {
          toast.error("Excel Parsing Engine Error: " + err.message);
      }
      setIsUploading(false);
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // Trigger reset visually
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold text-gray-900">CO-PO Target Matrix Mapping</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Active Syllabus Target</label>
        <select 
          className="w-full md:w-1/3 px-4 py-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">-- Choose Assigned Class --</option>
          {courses.map(c => (
             <option key={c._id} value={c._id}>
               {c.name} ({c.code}){c.section ? ` - Section ${c.section}` : ""}{c.session ? ` (${c.session})` : ""}
             </option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 animate-in fade-in duration-500">
          
          {/* Action Sidebar */}
          <div className="xl:col-span-1 space-y-6">
              
              {/* Batch Upload Block */}
              <div className="bg-white px-5 py-6 rounded-lg shadow border-2 border-green-200">
                 <h3 className="text-lg font-bold text-green-800 mb-2">Batch Matrix Upload</h3>
                 <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                     <strong className="text-blue-600 font-mono">CO</strong>, <strong className="text-blue-600 font-mono">PO1</strong>, <strong className="text-blue-600 font-mono">PO2</strong>, and <strong className="text-blue-600 font-mono">PSO1</strong>.
                 </p>
                 <label className={`block w-full py-2 bg-green-50 border border-green-300 text-green-800 text-sm font-bold text-center rounded cursor-pointer hover:bg-green-100 transition shadow-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isUploading ? "Uploading..." : "Upload CSV / Excel Matrix"}
                    <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
                 </label>
              </div>

              {/* Manual Override Creation */}
              <div className="bg-white px-5 py-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Manual CO Creation Fallback</h3>
                <form onSubmit={handleAddCO} className="space-y-4">
                  <input type="hidden" name="courseId" value={selectedCourse} />
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Target Syntax Code</label>
                    <input type="text" name="code" placeholder="e.g. CO2" required className="w-full px-3 py-2 border rounded text-sm"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Qualitative Syllabus Description</label>
                    <textarea name="description" rows={3} placeholder="Capable of parsing variables..." required className="w-full px-3 py-2 border rounded text-sm leading-relaxed"></textarea>
                  </div>
                  <button type="submit" className="w-full py-2 bg-slate-900 border border-slate-700 shadow-sm text-white text-sm font-medium rounded hover:bg-slate-800 transition">Create Target CO Explicitly</button>
                </form>
              </div>

          </div>

          {/* Interactive Core Matrix Component */}
          <div className="xl:col-span-3 bg-white p-6 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                 <h3 className="text-xl font-bold text-gray-900">Mathematical Mapping Matrix</h3>
                 <span className="text-xs text-gray-500 font-medium tracking-wide">Adjust correlations between Syllabus outcomes and NBA universal targets.</span>
              </div>
              <button 
                onClick={handleSaveMatrix} disabled={loading}
                className="px-6 py-2 bg-blue-600 shadow border border-blue-700 text-white font-medium text-sm rounded hover:bg-blue-700 transition"
              >
                {loading ? "Committing Operations..." : "Save Manual Adjustments"}
              </button>
            </div>

            {cos.length === 0 ? (
               <div className="bg-blue-50 rounded border border-blue-100 p-8 text-center text-blue-800">
                  Matrix grid hidden inherently: Please use the <strong>Batch Excel Uploader</strong> immediately to the left to spawn your baseline configurations instantly without manual entries.
               </div>
            ) : pos.length === 0 ? (
               <p className="text-orange-500 text-sm font-bold bg-orange-50 p-4 border rounded">No standard NBA generic targets discovered systematically (Empty Database). Alert server Administrator strictly regarding Settings initialization!</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b-2 border-r-2 border-gray-300 p-3 bg-gray-50 text-left w-28 text-slate-700 font-bold uppercase tracking-wider text-xs">Node Matrix</th>
                    {pos.map(po => (
                      <th key={po._id} className="border-b-2 border-x p-2 bg-gray-50 text-center text-xs font-bold text-slate-600" title={po.description}>
                        {po.code}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cos.map(co => (
                    <tr key={co._id} className="hover:bg-blue-50/30 transition-colors border-b last:border-0 border-gray-200">
                      <td className="border-r-2 border-gray-300 p-3 font-bold text-xs text-slate-800 bg-gray-50/50 whitespace-nowrap" title={co.description}>{co.code} <span className="text-[10px] font-normal text-slate-400 truncate block max-w-[100px]">{co.description}</span></td>
                      {pos.map(po => (
                        <td key={po._id} className="border-x p-1 align-middle h-12">
                          <select 
                            className={`w-full h-full bg-transparent border-0 text-center font-bold text-sm focus:ring-0 p-0 hover:bg-white cursor-pointer transition ${mappingMatrix[co._id]?.[po._id] > 0 ? 'text-blue-700' : 'text-slate-300'}`}
                            value={mappingMatrix[co._id]?.[po._id] || 0}
                            onChange={(e) => handleMatrixChange(co._id, po._id, e.target.value)}
                          >
                            <option value="0" className="text-slate-300">-</option>
                            <option value="1" className="text-gray-900 font-medium">1</option>
                            <option value="2" className="text-gray-900 font-medium">2</option>
                            <option value="3" className="text-blue-700 font-bold">3</option>
                          </select>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {cos.length > 0 && (
                <div className="mt-6 flex justify-end">
                    <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                       <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Weight Distribution Key</span>
                       <span className="h-4 w-[1px] bg-gray-300"></span>
                       <div className="flex gap-4 text-xs font-bold"><span className="text-slate-500">0 = Base Reject</span><span className="text-gray-900">1 = Low Scale</span><span className="text-gray-900">2 = Medium Impact</span><span className="text-blue-700">3 = High Correlation</span></div>
                    </div>
                </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
