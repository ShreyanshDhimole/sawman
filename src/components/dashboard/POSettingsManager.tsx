"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { updatePO, addOutcome, deletePO } from "@/actions/admin-actions";

export default function POSettingsManager({ initialPos }: { initialPos: any[] }) {
  const [pos, setPos] = useState(initialPos);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<"PSO" | "PEO">("PSO");

  const handleEdit = (po: any) => {
    setEditingId(po._id);
    setEditDesc(po.description);
  };

  const handleSave = async (id: string, code: string) => {
    const res = await updatePO(id, code, editDesc);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Updated successfully!");
      setPos(pos.map(p => p._id === id ? { ...p, description: editDesc } : p));
      setEditingId(null);
    }
  };

  const handleAddOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newDesc) return;
    
    const res = await addOutcome(newCode, newDesc, newType);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`${newCode} Added! Please refresh to reload state if needed.`);
      setNewCode("");
      setNewDesc("");
      window.location.reload(); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this outcome? It will break associated Co-PO mappings!")) return;
    const res = await deletePO(id);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Outcome deleted");
      setPos(pos.filter(p => p._id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {pos.map((po: any) => (
          <div key={po._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {editingId === po._id ? (
              <div className="flex-1 w-full space-y-2">
                 <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-900 bg-blue-100 px-2 py-1 rounded w-16 text-center">{po.code}</span>
                    <input 
                       type="text" 
                       value={editDesc} 
                       onChange={(e) => setEditDesc(e.target.value)} 
                       className="flex-1 px-3 py-2 border rounded focus:ring-blue-500 text-sm"
                    />
                 </div>
                 <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
                    <button onClick={() => handleSave(po._id, po.code)} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                 </div>
              </div>
            ) : (
              <>
                <div className="flex-1 flex gap-4 pr-4">
                  <span className={`font-bold text-center w-12 pt-0.5 ${po.type === 'PSO' ? 'text-purple-600' : po.type === 'PEO' ? 'text-teal-600' : 'text-blue-900'}`}>{po.code}</span>
                  <span className="flex-1 text-sm text-gray-700 leading-relaxed">{po.description}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(po)} className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200">Edit</button>
                  {po.type !== 'PO' && (
                     <button onClick={() => handleDelete(po._id)} className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200">Del</button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Custom Outcome</h3>
        <form onSubmit={handleAddOutcome} className="flex gap-3 items-start flex-wrap">
          <select 
             value={newType} 
             onChange={e => setNewType(e.target.value as "PSO"|"PEO")}
             className="px-4 py-2 border rounded text-sm focus:ring-purple-500 bg-white"
          >
             <option value="PSO">PSO</option>
             <option value="PEO">PEO</option>
          </select>
          <input 
            type="text" 
            placeholder="Code (e.g. PSO4, PEO1)" 
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="w-40 px-4 py-2 border rounded text-sm focus:ring-purple-500"
            required
          />
          <input 
            type="text" 
            placeholder="Description..." 
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border rounded text-sm focus:ring-purple-500"
            required
          />
          <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800">Add Outcome</button>
        </form>
      </div>
    </div>
  );
}
