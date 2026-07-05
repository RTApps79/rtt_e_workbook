// Case library for scenario-based learning in the TPS simulator

export const CASE_LIBRARY = [
  {
    id: "brain_wbrt_classic",
    name: "WBRT: Classic Case",
    site: "brain",
    description: `
      <b>Patient:</b> 72-year-old with multiple brain metastases.<br>
      <b>History:</b> No prior cranial radiation.<br>
      <b>Planning Goal:</b> Whole Brain Radiotherapy (WBRT) to cover all visible brain tissue.<br>
      <b>Special Considerations:</b> Lenses and eyes are close to the target; minimize dose to these OARs.
    `,
    imageSet: Array.from({ length: 50 }, (_, i) =>
      `https://placehold.co/600x500/111827/4b5563?text=Brain+Slice+${i + 1}`
    ),
    structures: {
      "PTV_WholeBrain":   { id: "PTV_WholeBrain", name: "PTV Whole Brain", type: "PTV", color: 'rgba(253, 224, 71, 0.3)', borderColor: '#fde047', x: 15, y: 10, w: 70, h: 80, shapeParams: { borderRadius: '45% 45% 35% 35% / 50% 50% 40% 40%' } },
      "OAR_Eye_L":        { id: "OAR_Eye_L", name: "Eye Left", type: "OAR", color: 'rgba(59, 130, 246, 0.4)', borderColor: '#3b82f6', x: 25, y: 38, w: 10, h: 8, shapeParams: { borderRadius: '50%' } },
      "OAR_Eye_R":        { id: "OAR_Eye_R", name: "Eye Right", type: "OAR", color: 'rgba(59, 130, 246, 0.4)', borderColor: '#3b82f6', x: 65, y: 38, w: 10, h: 8, shapeParams: { borderRadius: '50%' } },
      "OAR_Lens_L":       { id: "OAR_Lens_L", name: "Lens Left", type: "OAR", color: 'rgba(16, 185, 129, 0.5)', borderColor: '#10b981', x: 27, y: 40, w: 4, h: 3, shapeParams: { borderRadius: '50%' } },
      "OAR_Lens_R":       { id: "OAR_Lens_R", name: "Lens Right", type: "OAR", color: 'rgba(16, 185, 129, 0.5)', borderColor: '#10b981', x: 69, y: 40, w: 4, h: 3, shapeParams: { borderRadius: '50%' } },
      "OAR_OpticNerve_L": { id: "OAR_OpticNerve_L", name: "Optic Nerve L", type: "OAR", color: 'rgba(236, 72, 153, 0.4)', borderColor: '#ec4899', x: 35, y: 42, w: 10, h: 3, shapeParams: { borderRadius: '3px', transform: 'rotate(-10deg)' } },
      "OAR_OpticNerve_R": { id: "OAR_OpticNerve_R", name: "Optic Nerve R", type: "OAR", color: 'rgba(236, 72, 153, 0.4)', borderColor: '#ec4899', x: 55, y: 42, w: 10, h: 3, shapeParams: { borderRadius: '3px', transform: 'rotate(10deg)' } },
      "OAR_OpticChiasm":  { id: "OAR_OpticChiasm", name: "Optic Chiasm", type: "OAR", color: 'rgba(240, 82, 82, 0.4)', borderColor: '#f05252', x: 46, y: 46, w: 8, h: 4, shapeParams: { borderRadius: '20%' } },
      "OAR_Brainstem":    { id: "OAR_Brainstem", name: "Brainstem", type: "OAR", color: 'rgba(239, 68, 68, 0.5)', borderColor: '#ef4444', x: 45, y: 55, w: 10, h: 25, shapeParams: { borderRadius: '10px 10px 25px 25px' } }
    },
    objectives: [
      { label: "PTV D95%", key: "PTV_WholeBrain", metricType: "DoseAtVolume", value: 95, target: 30, unit: "Gy", description: "At least 95% of the PTV receives ≥30Gy" },
      { label: "Lens Max", key: "OAR_Lens_L", metricType: "MaxDose", target: 7, unit: "Gy", description: "Max Dose to each lens ≤7Gy" },
      { label: "Eye Max", key: "OAR_Eye_L", metricType: "MaxDose", target: 15, unit: "Gy", description: "Max Dose to each eye ≤15Gy" },
      { label: "Brainstem Max", key: "OAR_Brainstem", metricType: "MaxDose", target: 30, unit: "Gy", description: "Max Dose to brainstem ≤30Gy" },
      { label: "Chiasm Max", key: "OAR_OpticChiasm", metricType: "MaxDose", target: 30, unit: "Gy", description: "Max Dose to optic chiasm ≤30Gy" }
    ],
    scenarioChallenges: [
      "Minimize lens dose while ensuring full brain coverage.",
      "Consider field edge placement: can you spare the eyes without underdosing the brain?",
      "What beam arrangement achieves a uniform dose to the whole brain?"
    ]
  }
];