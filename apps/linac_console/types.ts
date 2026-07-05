export interface Jaws {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface MachineState {
  energy: string;
  muSet: number;
  muDelivered: number;
  gantryAngle: number;
  collimatorAngle: number;
  couchAngle: number;
  jaws: Jaws;
  isBeaming: boolean;
  isPrepared: boolean;
  isDoorOpen: boolean;
  statusMessage: string;
  statusType: 'idle' | 'active' | 'error' | 'warning';
}

export interface AlignmentCase {
  id: string;
  name: string;
  baseImage: string;
  overlayImage: string;
  description: string;
  targetShift: { x: number; y: number }; // The "correct" shift (Lat, Lng)
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  diagnosis: string;
  plan: string;
  chemo: string;
  alignmentCaseId: string;
  setup: {
    energy: string;
    gantry: number;
    collimator: number;
    couch: number;
    mu: number;
    jaws: Jaws;
  };
  labs: {
    creatinine: string;
    wbc: string;
  };
}

export interface SixDofCoords {
  vrt: number; // Vertical (cm)
  lng: number; // Longitudinal (cm)
  lat: number; // Lateral (cm)
  pitch: number; // Rotation X (deg)
  roll: number;  // Rotation Z (deg) - usually Roll is around longitudinal axis, typically Z in image space
  yaw: number;   // Rotation Y (deg)
}

export interface AlignmentLog {
  patientId: string;
  patientName: string;
  site: string;
  initialDeviation: SixDofCoords;
  correctionApplied: SixDofCoords;
  residualError: SixDofCoords;
  timestamp: string;
  toleranceMet: boolean;
}