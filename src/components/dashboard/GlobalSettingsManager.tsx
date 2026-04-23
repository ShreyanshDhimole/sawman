"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { updateGlobalSettings } from "@/actions/admin-actions";

export default function GlobalSettingsManager({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateGlobalSettings(settings);
    if (result.success) {
      toast.success("Global Text Parameters Updated!");
    } else {
      toast.error(result.error || "Save Failed");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Institute & Department Declarations</h2>
      <p className="text-gray-500 mb-6 text-sm">Modify these text blocks to reflect exactly on Faculty Course Files natively.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Vision of the Institute</label>
          <textarea 
             rows={3} 
             value={settings.VISION_INSTITUTE || ""} 
             onChange={e => handleChange('VISION_INSTITUTE', e.target.value)}
             className="w-full px-4 py-2 border rounded focus:ring-blue-500 text-sm leading-relaxed"
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Mission of the Institute</label>
          <textarea 
             rows={3} 
             value={settings.MISSION_INSTITUTE || ""} 
             onChange={e => handleChange('MISSION_INSTITUTE', e.target.value)}
             className="w-full px-4 py-2 border rounded focus:ring-blue-500 text-sm leading-relaxed"
          ></textarea>
        </div>
        <hr className="my-6 border-gray-200" />
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Vision of the Department</label>
          <textarea 
             rows={3} 
             value={settings.VISION_DEPT || ""} 
             onChange={e => handleChange('VISION_DEPT', e.target.value)}
             className="w-full px-4 py-2 border rounded focus:ring-blue-500 text-sm leading-relaxed"
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Mission of the Department</label>
          <textarea 
             rows={5} 
             value={settings.MISSION_DEPT || ""} 
             onChange={e => handleChange('MISSION_DEPT', e.target.value)}
             className="w-full px-4 py-2 border rounded focus:ring-blue-500 text-sm leading-relaxed"
          ></textarea>
        </div>
        <hr className="my-6 border-gray-200" />
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Course File Index Table</label>
          <textarea 
             rows={12} 
             value={settings.INDEX_TABLE || ""} 
             onChange={e => handleChange('INDEX_TABLE', e.target.value)}
             className="w-full px-4 py-2 border rounded focus:ring-blue-500 text-sm leading-relaxed font-mono"
             placeholder={"1. Vision and Mission...\n2. Program Outcome..."}
          ></textarea>
        </div>
      </div>
      
      <div className="pt-4 flex justify-end">
         <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-slate-900 border border-slate-700 text-white font-medium rounded hover:bg-slate-800 transition">
            {isSaving ? "Publishing..." : "Update Institutional Texts"}
         </button>
      </div>
    </div>
  );
}
