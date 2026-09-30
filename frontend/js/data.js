/**
 * Occulus — Clinical Data Store
 * Clinical mock database, sample fundus presets, and educational content
 */

const RETINA_DATA = {
  // Preset demo users
  currentUser: {
    id: "USR-001",
    name: "Dr. Sarah Jenkins, MD",
    role: "doctor", // 'doctor' or 'admin'
    email: "s.jenkins@occulus-hospital.org",
    hospital: "Occulus Eye Institute",
    department: "Vitreoretinal Diagnostics",
    avatar: "SJ"
  },

  adminUser: {
    id: "USR-099",
    name: "Dr. Robert Vance, MD",
    role: "admin",
    email: "r.vance@occulus-hospital.org",
    hospital: "Occulus Eye Institute",
    department: "Chief Medical Operations",
    avatar: "RV"
  },

  // 6 Target condition definitions
  conditions: [
    { code: "N", name: "Normal (No Pathologies)", key: "normal", color: "#10B981" },
    { code: "D", name: "Diabetic Retinopathy", key: "diabetes", color: "#EF4444" },
    { code: "G", name: "Glaucoma", key: "glaucoma", color: "#F59E0B" },
    { code: "C", name: "Cataract", key: "cataract", color: "#8B5CF6" },
    { code: "A", name: "Age-Related Macular Degeneration (AMD)", key: "amd", color: "#EC4899" },
    { code: "H", name: "Hypertensive Retinopathy", key: "hypertension", color: "#06B6D4" }
  ],

  // Sample Fundus Presets for One-Click Testing
  samplePresets: [
    {
      id: "preset-dr",
      title: "Diabetic Retinopathy",
      imagePath: "assets/samples/sample_diabetes.png",
      patientId: "PT-00124",
      patientName: "Eleanor Vance",
      age: 62,
      gender: "Female",
      eye: "Left",
      expectedProbabilities: { N: 0.02, D: 0.93, G: 0.14, C: 0.08, A: 0.05, H: 0.18 },
      detectedConditions: ["D"],
      quality: { status: "Acceptable", blurScore: 188.4, brightness: 114.2, contrast: 58.7 },
      notes: "Microaneurysms, dot hemorrhages, and hard exudates prominent in the superior arcade."
    },
    {
      id: "preset-glaucoma",
      title: "Glaucoma Suspicion",
      imagePath: "assets/samples/sample_glaucoma.png",
      patientId: "PT-00109",
      patientName: "Arthur Pendelton",
      age: 67,
      gender: "Male",
      eye: "Right",
      expectedProbabilities: { N: 0.04, D: 0.11, G: 0.88, C: 0.05, A: 0.06, H: 0.22 },
      detectedConditions: ["G"],
      quality: { status: "Acceptable", blurScore: 172.6, brightness: 108.5, contrast: 61.2 },
      notes: "Significant vertical cup-to-disc ratio (CDR ~0.78) with neuroretinal rim thinning."
    },
    {
      id: "preset-multilabel",
      title: "Diabetes + Hypertension",
      imagePath: "assets/samples/sample_hypertension.png",
      patientId: "PT-00115",
      patientName: "Margaret Shaw",
      age: 71,
      gender: "Female",
      eye: "Left",
      expectedProbabilities: { N: 0.01, D: 0.86, G: 0.18, C: 0.12, A: 0.09, H: 0.79 },
      detectedConditions: ["D", "H"],
      quality: { status: "Acceptable", blurScore: 194.1, brightness: 119.8, contrast: 63.4 },
      notes: "Arteriolar narrowing with AV nicking and blot retinal hemorrhages in temporal quadrant."
    },
    {
      id: "preset-cataract",
      title: "Cataract (Lens Opacity)",
      imagePath: "assets/samples/sample_cataract.png",
      patientId: "PT-00098",
      patientName: "Walter Collins",
      age: 75,
      gender: "Male",
      eye: "Right",
      expectedProbabilities: { N: 0.06, D: 0.08, G: 0.07, C: 0.91, A: 0.04, H: 0.11 },
      detectedConditions: ["C"],
      quality: { status: "Acceptable", blurScore: 112.3, brightness: 98.6, contrast: 42.1 },
      notes: "Diffuse media haze consistent with nuclear sclerotic cataract."
    },
    {
      id: "preset-amd",
      title: "Macular Degeneration",
      imagePath: "assets/samples/sample_amd.png",
      patientId: "PT-00142",
      patientName: "Clara Higgins",
      age: 79,
      gender: "Female",
      eye: "Left",
      expectedProbabilities: { N: 0.03, D: 0.12, G: 0.09, C: 0.15, A: 0.89, H: 0.16 },
      detectedConditions: ["A"],
      quality: { status: "Acceptable", blurScore: 165.7, brightness: 104.3, contrast: 55.8 },
      notes: "Confluent soft drusen and retinal pigment epithelium (RPE) mottling in the central macula."
    },
    {
      id: "preset-normal",
      title: "Healthy Fundus",
      imagePath: "assets/samples/sample_normal.png",
      patientId: "PT-00103",
      patientName: "Jameson Rivera",
      age: 38,
      gender: "Male",
      eye: "Right",
      expectedProbabilities: { N: 0.96, D: 0.02, G: 0.03, C: 0.01, A: 0.01, H: 0.03 },
      detectedConditions: ["N"],
      quality: { status: "Acceptable", blurScore: 210.5, brightness: 122.1, contrast: 66.8 },
      notes: "Sharp optic disc margins, healthy foveal light reflex, no vascular abnormalities."
    }
  ],

  // Recent Patient Records
  patients: [
    {
      id: "PT-00124",
      name: "Eleanor Vance",
      age: 62,
      gender: "Female",
      phone: "+1 (555) 234-5678",
      history: "Type 2 Diabetes (12 yrs), Hypertension",
      lastScreening: "2026-09-21",
      screeningsCount: 4,
      flaggedConditions: ["Diabetic Retinopathy"]
    },
    {
      id: "PT-00109",
      name: "Arthur Pendelton",
      age: 67,
      gender: "Male",
      phone: "+1 (555) 345-6789",
      history: "Elevated IOP (Intraocular Pressure)",
      lastScreening: "2026-09-20",
      screeningsCount: 3,
      flaggedConditions: ["Glaucoma"]
    },
    {
      id: "PT-00115",
      name: "Margaret Shaw",
      age: 71,
      gender: "Female",
      phone: "+1 (555) 456-7890",
      history: "Chronic Hypertension, Type 2 Diabetes",
      lastScreening: "2026-09-18",
      screeningsCount: 5,
      flaggedConditions: ["Diabetic Retinopathy", "Hypertension"]
    },
    {
      id: "PT-00098",
      name: "Walter Collins",
      age: 75,
      gender: "Male",
      phone: "+1 (555) 567-8901",
      history: "Progressive visual blurring",
      lastScreening: "2026-09-15",
      screeningsCount: 2,
      flaggedConditions: ["Cataract"]
    },
    {
      id: "PT-00103",
      name: "Jameson Rivera",
      age: 38,
      gender: "Male",
      phone: "+1 (555) 678-9012",
      history: "Routine annual checkup",
      lastScreening: "2026-09-12",
      screeningsCount: 1,
      flaggedConditions: ["Normal"]
    }
  ],

  // Historical Screening Records
  screenings: [
    {
      id: "SCR-00128",
      patientId: "PT-00124",
      patientName: "Eleanor Vance",
      date: "2026-09-21",
      eye: "Left",
      findings: "Diabetic Retinopathy (93%)",
      status: "Requires Review",
      statusCode: "review",
      imagePath: "assets/samples/sample_diabetes.png",
      probabilities: { N: 0.02, D: 0.93, G: 0.14, C: 0.08, A: 0.05, H: 0.18 },
      quality: "Acceptable",
      reviewer: "Dr. Sarah Jenkins",
      reviewedDate: "2026-09-21 10:15"
    },
    {
      id: "SCR-00127",
      patientId: "PT-00109",
      patientName: "Arthur Pendelton",
      date: "2026-09-20",
      eye: "Right",
      findings: "Glaucoma Suspicion (88%)",
      status: "Reviewed",
      statusCode: "reviewed",
      imagePath: "assets/samples/sample_glaucoma.png",
      probabilities: { N: 0.04, D: 0.11, G: 0.88, C: 0.05, A: 0.06, H: 0.22 },
      quality: "Acceptable",
      reviewer: "Dr. Sarah Jenkins",
      reviewedDate: "2026-09-20 16:40"
    },
    {
      id: "SCR-00126",
      patientId: "PT-00115",
      patientName: "Margaret Shaw",
      date: "2026-09-18",
      eye: "Left",
      findings: "Diabetes (86%) + Hypertension (79%)",
      status: "Requires Review",
      statusCode: "review",
      imagePath: "assets/samples/sample_hypertension.png",
      probabilities: { N: 0.01, D: 0.86, G: 0.18, C: 0.12, A: 0.09, H: 0.79 },
      quality: "Acceptable",
      reviewer: "Pending Review",
      reviewedDate: null
    },
    {
      id: "SCR-00125",
      patientId: "PT-00098",
      patientName: "Walter Collins",
      date: "2026-09-15",
      eye: "Right",
      findings: "Cataract (91%)",
      status: "Reviewed",
      statusCode: "reviewed",
      imagePath: "assets/samples/sample_cataract.png",
      probabilities: { N: 0.06, D: 0.08, G: 0.07, C: 0.91, A: 0.04, H: 0.11 },
      quality: "Acceptable",
      reviewer: "Dr. Marcus Reed",
      reviewedDate: "2026-09-16 09:20"
    },
    {
      id: "SCR-00124",
      patientId: "PT-00103",
      patientName: "Jameson Rivera",
      date: "2026-09-12",
      eye: "Right",
      findings: "Normal Fundus (96%)",
      status: "Reviewed",
      statusCode: "reviewed",
      imagePath: "assets/samples/sample_normal.png",
      probabilities: { N: 0.96, D: 0.02, G: 0.03, C: 0.01, A: 0.01, H: 0.03 },
      quality: "Acceptable",
      reviewer: "Dr. Sarah Jenkins",
      reviewedDate: "2026-09-12 11:05"
    }
  ],

  // Hospital Analytics & Benchmarks
  analytics: {
    totalScreenings: 128,
    abnormalCases: 89,
    normalCases: 33,
    reUploadNeeded: 6,
    distribution: [
      { label: "Diabetes (DR)", count: 48, percentage: 37.5 },
      { label: "Glaucoma", count: 28, percentage: 21.8 },
      { label: "Cataract", count: 24, percentage: 18.7 },
      { label: "AMD", count: 19, percentage: 14.8 },
      { label: "Hypertension", count: 14, percentage: 10.9 }
    ],
    modelBenchmarks: {
      backbone: "ConvNeXt-Tiny",
      macroAUC: 0.941,
      macroF1: 0.884,
      precision: 0.892,
      recall: 0.876,
      specificity: 0.962
    }
  },

  // Longitudinal Trend Mock
  healthTrends: {
    patientId: "PT-00124",
    patientName: "Eleanor Vance",
    condition: "Diabetic Retinopathy",
    series: [
      { date: "Jun 2026", score: 61, label: "Mild Non-Proliferative" },
      { date: "Jul 2026", score: 68, label: "Moderate Non-Proliferative" },
      { date: "Aug 2026", score: 79, label: "Moderate with Macular Edema" },
      { date: "Sep 2026", score: 93, label: "Severe NPDR" }
    ]
  },

  // Eye Explorer Anatomical Hotspots
  anatomyHotspots: [
    {
      id: "optic-disc",
      title: "Optic Nerve Head (Optic Disc)",
      top: "46%",
      left: "32%",
      summary: "The exit point for retinal ganglion cell axons leaving the eye.",
      details: "Pathologies: Glaucomatous cupping, disc pallor, neuroretinal rim thinning, and papilledema.",
      relevance: "Primary diagnostic site for Glaucoma screening (CDR estimation)."
    },
    {
      id: "macula",
      title: "Macula Lutea & Fovea",
      top: "50%",
      left: "62%",
      summary: "The specialized central region responsible for sharp, high-acuity color vision.",
      details: "Pathologies: Age-Related Macular Degeneration (AMD drusen, geographic atrophy), diabetic macular edema.",
      relevance: "Critical zone for AMD and vision-threatening diabetic retinopathy lesions."
    },
    {
      id: "superior-arcade",
      title: "Superior Retinal Vascular Arcade",
      top: "28%",
      left: "48%",
      summary: "Major retinal arterioles and venules supplying the superior quadrants.",
      details: "Pathologies: Arteriolar attenuation, arteriovenous (AV) nicking, flame hemorrhages, cotton-wool spots.",
      relevance: "Directly evaluated for Hypertensive Retinopathy and branch vein occlusions."
    },
    {
      id: "inferior-arcade",
      title: "Inferior Retinal Vascular Arcade",
      top: "70%",
      left: "48%",
      summary: "Lower vascular branching network nourishing the inferior retinal periphery.",
      details: "Pathologies: Dot/blot hemorrhages, microaneurysms, hard lipid exudates.",
      relevance: "Frequent location for early diabetic microvascular abnormalities."
    }
  ]
};
