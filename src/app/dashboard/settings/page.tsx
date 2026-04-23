import dbConnect from "@/lib/mongoose";
import PO from "@/models/PO";
import Setting from "@/models/Setting";
import { revalidatePath } from "next/cache";
import POSettingsManager from "@/components/dashboard/POSettingsManager";
import GlobalSettingsManager from "@/components/dashboard/GlobalSettingsManager";
import CalculationSettingsManager from "@/components/dashboard/CalculationSettingsManager";

export const dynamic = "force-dynamic";

async function seedDefaultPOs() {
  "use server";
  
  await dbConnect();

  const defaultPOs = [
    { code: "PO1", description: "Engineering knowledge: Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems.", type: "PO" },
    { code: "PO2", description: "Problem analysis: Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.", type: "PO" },
    { code: "PO3", description: "Design/development of solutions: Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for public health and safety, and the cultural, societal, and environmental considerations.", type: "PO" },
    { code: "PO4", description: "Conduct investigations of complex problems: Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.", type: "PO" },
    { code: "PO5", description: "Modern tool usage: Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations.", type: "PO" },
    { code: "PO6", description: "The engineer and society: Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.", type: "PO" },
    { code: "PO7", description: "Environment and sustainability: Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.", type: "PO" },
    { code: "PO8", description: "Ethics: Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.", type: "PO" },
    { code: "PO9", description: "Individual and team work: Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.", type: "PO" },
    { code: "PO10", description: "Communication: Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.", type: "PO" },
    { code: "PO11", description: "Project management and finance: Demonstrate knowledge and understanding of the engineering and management principles and apply these to one’s own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.", type: "PO" },
    { code: "PO12", description: "Life-long learning: Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.", type: "PO" },
    { code: "PSO1", description: "Students will be able to understand and manage appropriate Information Technology recourses to achieve goals and objectives of an individual as well as organization.", type: "PSO" },
    { code: "PSO2", description: "Students will be able to design and develop inexpensive, secure and robust IT products and applications using state-of-the-art tools and techniques.", type: "PSO" },
    { code: "PSO3", description: "Students will be able to pursue higher studies, research and career in entrepreneurship.", type: "PSO" },
    { code: "PEO1", description: "Prepare engineering graduates to become empowered IT technocrats with comprehensive knowledge and skills to serve the evolving IT industry.", type: "PEO" },
    { code: "PEO2", description: "Empower graduates to pursue higher education and research.", type: "PEO" },
    { code: "PEO3", description: "Develop skills of engineering graduates to enable them to become an entrepreneur by observing global changes and needs.", type: "PEO" },
    { code: "PEO4", description: "Prepare engineering graduates who are conditioned to handle challenging tasks as an individual or as a team.", type: "PEO" }
  ];

  for(const po of defaultPOs) {
    await PO.updateOne({ code: po.code }, { $setOnInsert: po }, { upsert: true });
  }

  const defaultSettings = [
    { key: "VISION_INSTITUTE", value: "A front-line institute in science and technology making significant contributions to human resource development envisaging dynamic needs of the society." },
    { key: "MISSION_INSTITUTE", value: "To generate experts in science and technology akin to society for its accelerated socioeconomic growth in professional and challenging environment imparting human values." },
    { key: "VISION_DEPT", value: "To create IT technocrats equipped with skills, ethics and social values for developing globalized and technological solutions for betterment of society through transformative education." },
    { key: "MISSION_DEPT", value: "To enable students become technocrats who can cater the growing manpower need of the industry for economic development." },
    { key: "INDEX_TABLE", value: "1. Vision and Mission of Institute & Department\n2. Program Outcome (PO)\n3. Program Specific Outcome (PSO), Program Education Objectives (PEO)\n4. Syllabus with Course Outcomes (COs)\n5. Time Table\n6. Lecture Plan\n7. Attendance of Students\n8. Mid Term Test Papers\n9. Mid Term Evaluation\n10. Class Assignment/Lab Assignment\n11. End Term Test Paper\n12. End Term Evaluation\n13. CO Attainment\n14. CO-PO Attainment\n15. Remark" },
    { key: "LEVEL3_THRESHOLD", value: "65" },
    { key: "LEVEL2_THRESHOLD", value: "50" },
    { key: "LEVEL1_THRESHOLD", value: "35" },
    { key: "DIRECT_ENDSEM_WEIGHT", value: "0.7" },
    { key: "DIRECT_INTERNAL_WEIGHT", value: "0.3" },
    { key: "FINAL_DIRECT_WEIGHT", value: "0.8" },
    { key: "FINAL_INDIRECT_WEIGHT", value: "0.2" }
  ];

  for(const setting of defaultSettings) {
    await Setting.updateOne({ key: setting.key }, { $setOnInsert: { value: setting.value } }, { upsert: true });
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/course-file");
  revalidatePath("/dashboard/co-po-mapping");
}

export default async function SettingsPage() {
  await dbConnect();
  const posCount = await PO.countDocuments();
  
  // Sort POs before PSOs by checking type, then sort by code length/value
  const rawPos = await PO.find({}).lean();
  const sortedPos = rawPos.sort((a, b) => {
     if (a.type !== b.type) {
       if (a.type === 'PO') return -1;
       if (b.type === 'PO') return 1;
       if (a.type === 'PSO') return -1;
       if (b.type === 'PSO') return 1;
     }
     return a.code.localeCompare(b.code, undefined, { numeric: true });
  });

  const pos = JSON.parse(JSON.stringify(sortedPos));

  const rawSettings = await Setting.find({}).lean();
  const initialSettingsObj: Record<string, string> = {};
  rawSettings.forEach((s: any) => initialSettingsObj[s.key] = s.value);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
      
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">Program Outcomes (POs) & Custom Targets</h2>
        <p className="text-gray-500 mb-6 text-sm">Configure NBA guidelines alongside your Program Specific Outcomes (PSOs) and Educational Objectives (PEOs).</p>
        
        {posCount === 0 || Object.keys(initialSettingsObj).length === 0 ? (
          <form action={seedDefaultPOs}>
             <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition shadow">
               Initialize Default Database Variables
             </button>
             <p className="text-sm font-semibold text-orange-500 mt-4 bg-orange-50 p-3 rounded">
                ⚠️ Settings configuration is mandatory before utilizing matrices or course files.
             </p>
          </form>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
               <span className="text-green-700 font-medium bg-green-50 px-3 py-1 rounded inline-block">
                 ✓ Targets & Configurations Loaded
               </span>
            </div>
            {/* Inject the interactive client manager */}
            <POSettingsManager initialPos={pos} />
          </div>
        )}
      </section>

      {Object.keys(initialSettingsObj).length > 0 && (
        <GlobalSettingsManager initialSettings={initialSettingsObj} />
      )}

      {Object.keys(initialSettingsObj).length > 0 && (
        <CalculationSettingsManager initialSettings={initialSettingsObj} />
      )}
    </div>
  );
}
