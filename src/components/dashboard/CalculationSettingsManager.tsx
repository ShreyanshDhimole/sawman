"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { updateGlobalSettings } from "@/actions/admin-actions";

interface CalculationSettings {
  LEVEL3_THRESHOLD: string;
  LEVEL2_THRESHOLD: string;
  LEVEL1_THRESHOLD: string;
  DIRECT_ENDSEM_WEIGHT: string;
  DIRECT_INTERNAL_WEIGHT: string;
  FINAL_DIRECT_WEIGHT: string;
  FINAL_INDIRECT_WEIGHT: string;
}

const DEFAULTS: CalculationSettings = {
  LEVEL3_THRESHOLD: "65",
  LEVEL2_THRESHOLD: "50",
  LEVEL1_THRESHOLD: "35",
  DIRECT_ENDSEM_WEIGHT: "0.7",
  DIRECT_INTERNAL_WEIGHT: "0.3",
  FINAL_DIRECT_WEIGHT: "0.8",
  FINAL_INDIRECT_WEIGHT: "0.2",
};

export default function CalculationSettingsManager({
  initialSettings,
}: {
  initialSettings: Record<string, string>;
}) {
  const [settings, setSettings] = useState<CalculationSettings>({
    LEVEL3_THRESHOLD: initialSettings.LEVEL3_THRESHOLD || DEFAULTS.LEVEL3_THRESHOLD,
    LEVEL2_THRESHOLD: initialSettings.LEVEL2_THRESHOLD || DEFAULTS.LEVEL2_THRESHOLD,
    LEVEL1_THRESHOLD: initialSettings.LEVEL1_THRESHOLD || DEFAULTS.LEVEL1_THRESHOLD,
    DIRECT_ENDSEM_WEIGHT: initialSettings.DIRECT_ENDSEM_WEIGHT || DEFAULTS.DIRECT_ENDSEM_WEIGHT,
    DIRECT_INTERNAL_WEIGHT: initialSettings.DIRECT_INTERNAL_WEIGHT || DEFAULTS.DIRECT_INTERNAL_WEIGHT,
    FINAL_DIRECT_WEIGHT: initialSettings.FINAL_DIRECT_WEIGHT || DEFAULTS.FINAL_DIRECT_WEIGHT,
    FINAL_INDIRECT_WEIGHT: initialSettings.FINAL_INDIRECT_WEIGHT || DEFAULTS.FINAL_INDIRECT_WEIGHT,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: keyof CalculationSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const l3 = parseFloat(settings.LEVEL3_THRESHOLD);
    const l2 = parseFloat(settings.LEVEL2_THRESHOLD);
    const l1 = parseFloat(settings.LEVEL1_THRESHOLD);

    if (isNaN(l3) || isNaN(l2) || isNaN(l1) || l3 <= l2 || l2 <= l1 || l1 <= 0) {
      toast.error("Thresholds must be in descending order: Level 3 > Level 2 > Level 1 > 0");
      return;
    }

    const endWeight = parseFloat(settings.DIRECT_ENDSEM_WEIGHT);
    const internalWeight = parseFloat(settings.DIRECT_INTERNAL_WEIGHT);
    if (isNaN(endWeight) || isNaN(internalWeight) || Math.abs(endWeight + internalWeight - 1) > 0.01) {
      toast.error("End Sem and Internal weights must sum to 1.0");
      return;
    }

    const directWeight = parseFloat(settings.FINAL_DIRECT_WEIGHT);
    const indirectWeight = parseFloat(settings.FINAL_INDIRECT_WEIGHT);
    if (isNaN(directWeight) || isNaN(indirectWeight) || Math.abs(directWeight + indirectWeight - 1) > 0.01) {
      toast.error("Direct and Indirect weights must sum to 1.0");
      return;
    }

    setIsSaving(true);
    const result = await updateGlobalSettings(settings as unknown as Record<string, string>);
    if (result.success) {
      toast.success("Calculation parameters updated");
    } else {
      toast.error(result.error || "Failed to save calculation parameters");
    }
    setIsSaving(false);
  };

  const handleReset = () => {
    setSettings({ ...DEFAULTS });
    toast.success("Reset to default values. Save to apply them.");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8 space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">CO-PO Calculation Parameters</h2>
          <p className="text-gray-500 text-sm mt-1">
            These values control attainment thresholds and weighting formulas across reports.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 font-medium"
        >
          Reset Defaults
        </button>
      </div>

      <div className="border border-blue-200 rounded-lg p-5 bg-blue-50/40">
        <h3 className="text-sm font-bold text-blue-900 mb-1">Attainment Thresholds</h3>
        <p className="text-xs text-blue-700 mb-4">
          Students are assigned levels based on percentage scored against maximum marks.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm text-gray-700">
            Level 3
            <input
              type="number"
              value={settings.LEVEL3_THRESHOLD}
              onChange={(e) => handleChange("LEVEL3_THRESHOLD", e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded text-sm font-semibold"
            />
          </label>
          <label className="text-sm text-gray-700">
            Level 2
            <input
              type="number"
              value={settings.LEVEL2_THRESHOLD}
              onChange={(e) => handleChange("LEVEL2_THRESHOLD", e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded text-sm font-semibold"
            />
          </label>
          <label className="text-sm text-gray-700">
            Level 1
            <input
              type="number"
              value={settings.LEVEL1_THRESHOLD}
              onChange={(e) => handleChange("LEVEL1_THRESHOLD", e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded text-sm font-semibold"
            />
          </label>
        </div>
      </div>

      <div className="border border-purple-200 rounded-lg p-5 bg-purple-50/40">
        <h3 className="text-sm font-bold text-purple-900 mb-1">Direct Attainment Weight</h3>
        <p className="text-xs text-purple-700 mb-4">
          End semester and internal attainment must sum to 1.0.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-gray-700">
            End Semester Weight
            <input
              type="number"
              step="0.01"
              value={settings.DIRECT_ENDSEM_WEIGHT}
              onChange={(e) => handleChange("DIRECT_ENDSEM_WEIGHT", e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded text-sm font-semibold"
            />
          </label>
          <label className="text-sm text-gray-700">
            Internal Weight
            <input
              type="number"
              step="0.01"
              value={settings.DIRECT_INTERNAL_WEIGHT}
              onChange={(e) => handleChange("DIRECT_INTERNAL_WEIGHT", e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded text-sm font-semibold"
            />
          </label>
        </div>
      </div>

      <div className="border border-teal-200 rounded-lg p-5 bg-teal-50/40">
        <h3 className="text-sm font-bold text-teal-900 mb-1">Final Attainment Weight</h3>
        <p className="text-xs text-teal-700 mb-4">
          Direct and indirect attainment must sum to 1.0.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-gray-700">
            Direct Weight
            <input
              type="number"
              step="0.01"
              value={settings.FINAL_DIRECT_WEIGHT}
              onChange={(e) => handleChange("FINAL_DIRECT_WEIGHT", e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded text-sm font-semibold"
            />
          </label>
          <label className="text-sm text-gray-700">
            Indirect Weight
            <input
              type="number"
              step="0.01"
              value={settings.FINAL_INDIRECT_WEIGHT}
              onChange={(e) => handleChange("FINAL_INDIRECT_WEIGHT", e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded text-sm font-semibold"
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded hover:bg-slate-800 transition shadow"
        >
          {isSaving ? "Saving..." : "Save Calculation Parameters"}
        </button>
      </div>
    </div>
  );
}
