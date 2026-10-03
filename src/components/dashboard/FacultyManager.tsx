"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { updateFaculty, deleteFaculty } from "@/actions/admin-actions";
import { Pencil, Trash2, X, Check, Search } from "lucide-react";

export default function FacultyManager({ faculty }: { faculty: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const startEdit = (fac: any) => {
    setEditingId(fac._id);
    setEditName(fac.name);
    setEditEmail(fac.email);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
  };

  const handleUpdate = async (id: string) => {
    if (!editName || !editEmail) {
      toast.error("Name and Email are required");
      return;
    }
    setLoading(true);
    const result = await updateFaculty(id, editName, editEmail);
    if (result.success) {
      toast.success("Faculty updated successfully!");
      setEditingId(null);
    } else {
      toast.error(result.error || "Failed to update faculty");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this faculty member? Their assigned courses may be orphaned.")) return;
    setLoading(true);
    const result = await deleteFaculty(id);
    if (result.success) {
      toast.success("Faculty deleted successfully!");
    } else {
      toast.error(result.error || "Failed to delete faculty");
    }
    setLoading(false);
  };

  const filteredFaculty = faculty.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Manage Faculty</h2>
        <div className="relative w-full sm:w-64">
          <input 
            type="text" 
            placeholder="Search faculty..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>
      </div>
      
      {filteredFaculty.length === 0 ? (
        <p className="text-gray-500 text-sm">No faculty members found.</p>
      ) : (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredFaculty.map((fac) => (
                <tr key={fac._id} className="hover:bg-gray-50">
                  {editingId === fac._id ? (
                    <>
                      <td className="px-4 py-2">
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="email" 
                          value={editEmail} 
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-2 text-center flex justify-center gap-2">
                        <button onClick={() => handleUpdate(fac._id)} disabled={loading} className="text-green-600 hover:text-green-800 p-1">
                          <Check size={16} />
                        </button>
                        <button onClick={cancelEdit} disabled={loading} className="text-gray-400 hover:text-gray-600 p-1">
                          <X size={16} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 text-sm text-gray-900">{fac.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{fac.email}</td>
                      <td className="px-4 py-2 text-center flex justify-center gap-2">
                        <button onClick={() => startEdit(fac)} disabled={loading} className="text-blue-500 hover:text-blue-700 p-1">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(fac._id)} disabled={loading} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
