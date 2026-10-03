import dbConnect from "@/lib/mongoose";
import Setting from "@/models/Setting";
export type CalculationConfig = {
  level3Threshold: number;
  level2Threshold: number;
  level1Threshold: number;
  directEndSemWeight: number;
  directInternalWeight: number;
  finalDirectWeight: number;
  finalIndirectWeight: number;
};

export const DEFAULT_CALC_CONFIG: CalculationConfig = {
  level3Threshold: 65,
  level2Threshold: 50,
  level1Threshold: 35,
  directEndSemWeight: 0.7,
  directInternalWeight: 0.3,
  finalDirectWeight: 0.8,
  finalIndirectWeight: 0.2
};

export async function getCalculationConfig() {
  await dbConnect();
  const settings = await Setting.find({
    key: { $in: [
      "LEVEL3_THRESHOLD", "LEVEL2_THRESHOLD", "LEVEL1_THRESHOLD",
      "DIRECT_ENDSEM_WEIGHT", "DIRECT_INTERNAL_WEIGHT",
      "FINAL_DIRECT_WEIGHT", "FINAL_INDIRECT_WEIGHT"
    ] }
  }).lean();

  // if (!settings.length) return DEFAULT_CALC_CONFIG;

  const map: Record<string, string> = {};
  settings.forEach((s: any) => map[s.key] = s.value);

  return {
    level3Threshold: parseFloat(map.LEVEL3_THRESHOLD) ,
    level2Threshold: parseFloat(map.LEVEL2_THRESHOLD) || DEFAULT_CALC_CONFIG.level2Threshold,
    level1Threshold: parseFloat(map.LEVEL1_THRESHOLD) || DEFAULT_CALC_CONFIG.level1Threshold,
    directEndSemWeight: parseFloat(map.DIRECT_ENDSEM_WEIGHT) || DEFAULT_CALC_CONFIG.directEndSemWeight,
    directInternalWeight: parseFloat(map.DIRECT_INTERNAL_WEIGHT) || DEFAULT_CALC_CONFIG.directInternalWeight,
    finalDirectWeight: parseFloat(map.FINAL_DIRECT_WEIGHT) || DEFAULT_CALC_CONFIG.finalDirectWeight,
    finalIndirectWeight: parseFloat(map.FINAL_INDIRECT_WEIGHT) ,
  };
}
