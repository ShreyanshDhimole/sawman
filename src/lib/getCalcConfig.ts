import dbConnect from "@/lib/mongoose";
import Setting from "@/models/Setting";
import { CalculationConfig, DEFAULT_CALC_CONFIG } from "@/lib/calculations";

export async function getCalculationConfig(): Promise<CalculationConfig> {
  await dbConnect();

  const settings = await Setting.find({
    key: {
      $in: [
        "LEVEL3_THRESHOLD",
        "LEVEL2_THRESHOLD",
        "LEVEL1_THRESHOLD",
        "DIRECT_ENDSEM_WEIGHT",
        "DIRECT_INTERNAL_WEIGHT",
        "FINAL_DIRECT_WEIGHT",
        "FINAL_INDIRECT_WEIGHT",
      ],
    },
  }).lean();

  if (!settings.length) return DEFAULT_CALC_CONFIG;

  const map: Record<string, string> = {};
  settings.forEach((setting: any) => {
    map[setting.key] = setting.value;
  });

  return {
    level3Threshold: parseFloat(map.LEVEL3_THRESHOLD) || DEFAULT_CALC_CONFIG.level3Threshold,
    level2Threshold: parseFloat(map.LEVEL2_THRESHOLD) || DEFAULT_CALC_CONFIG.level2Threshold,
    level1Threshold: parseFloat(map.LEVEL1_THRESHOLD) || DEFAULT_CALC_CONFIG.level1Threshold,
    directEndSemWeight: parseFloat(map.DIRECT_ENDSEM_WEIGHT) || DEFAULT_CALC_CONFIG.directEndSemWeight,
    directInternalWeight: parseFloat(map.DIRECT_INTERNAL_WEIGHT) || DEFAULT_CALC_CONFIG.directInternalWeight,
    finalDirectWeight: parseFloat(map.FINAL_DIRECT_WEIGHT) || DEFAULT_CALC_CONFIG.finalDirectWeight,
    finalIndirectWeight: parseFloat(map.FINAL_INDIRECT_WEIGHT) || DEFAULT_CALC_CONFIG.finalIndirectWeight,
  };
}
