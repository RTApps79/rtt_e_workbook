import React, { useState, useEffect, useRef } from 'react';
import EmrPanel from './components/EmrPanel';
import BeamControlPanel from './components/BeamControlPanel';
import LinacControls from './components/LinacControls';
import ImageAlignmentPanel from './components/ImageAlignmentPanel';
import MachineReadout from './components/MachineReadout';
import ConeSelectionModal from './components/ConeSelectionModal';
import { MachineState, Jaws, Patient, AlignmentLog } from './types';
import { ENERGY_OPTIONS } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [alignmentLogs, setAlignmentLogs] = useState<AlignmentLog[]>([]);
  
  const [state, setState] = useState<MachineState>({
    energy: '6 MV',
    muSet: 100,
    muDelivered: 0,
    gantryAngle: 0,
    collimatorAngle: 0,
    couchAngle: 0,
    jaws: { x1: 5.0, x2: 5.0, y1: 5.0, y2: 5.0 },
    isBeaming: false,
    isPrepared: false,
    isDoorOpen: false,
    statusMessage: 'System Idle - Select Patient',
    statusType: 'idle'
  });

  const [isConeModalOpen, setConeModalOpen] = useState(false);
  const beamIntervalRef = useRef<number | null>(null);

  // --- Handlers ---

  const handleLoadPatient = (patient: Patient) => {
    setCurrentPatient(patient);
    // Auto-setup machine based on patient plan
    setState(prev => ({
      ...prev,
      energy: patient.setup.energy,
      muSet: patient.setup.mu,
      muDelivered: 0,
      gantryAngle: patient.setup.gantry,
      collimatorAngle: patient.setup.collimator,
      couchAngle: patient.setup.couch,
      jaws: patient.setup.jaws,
      isBeaming: false,
      isPrepared: false,
      statusMessage: `Loaded: ${patient.name} - ${patient.plan}`,
      statusType: 'idle'
    }));
  };

  const handleRecordAlignment = (log: AlignmentLog) => {
    setAlignmentLogs(prev => [...prev, log]);
    
    // Check main translational error for quick status
    const maxErr = Math.max(
       Math.abs(log.residualError.lat), 
       Math.abs(log.residualError.lng), 
       Math.abs(log.residualError.vrt)
    );
    
    setState(prev => ({
      ...prev,
      statusMessage: `6DoF Shift Applied. Residual Max: ${maxErr.toFixed(2)} cm`,
      statusType: log.toleranceMet ? 'active' : 'warning'
    }));
  };

  const handleSetEnergy = (energy: string) => {
    setState(prev => ({
      ...prev,
      energy,
      isPrepared: false,
      statusMessage: `Status: ${energy} Selected`,
      statusType: 'idle'
    }));
  };

  const handleSetMu = () => {
    const input = prompt("Enter MU (1-1000):", state.muSet.toString());
    if (input === null) return;
    const val = parseInt(input);
    if (!isNaN(val) && val > 0 && val <= 1000) {
      setState(prev => ({
        ...prev,
        muSet: val,
        muDelivered: 0,
        isPrepared: false,
        statusMessage: 'Status: Parameters Changed',
        statusType: 'idle'
      }));
    } else {
      alert("Invalid MU");
    }
  };

  const handleSetField = () => {
    const input = prompt("Enter Field Size XxY (e.g. 10x10):", 
      `${(state.jaws.x1 + state.jaws.x2).toFixed(0)}x${(state.jaws.y1 + state.jaws.y2).toFixed(0)}`
    );
    if (input === null) return;
    const parts = input.toLowerCase().split('x');
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);

    if (!isNaN(x) && !isNaN(y) && x > 0 && x <= 40 && y > 0 && y <= 40) {
      const halfX = x / 2;
      const halfY = y / 2;
      setState(prev => ({
        ...prev,
        jaws: { x1: halfX, x2: halfX, y1: halfY, y2: halfY },
        isPrepared: false,
        statusMessage: 'Status: Field Adjusted',
        statusType: 'idle'
      }));
    } else {
      alert("Invalid Field Size");
    }
  };

  const handleConeSelect = (size: number) => {
    const jawSize = (size / 2) + 1; // Cone + 2cm
    setState(prev => ({
      ...prev,
      jaws: { x1: jawSize, x2: jawSize, y1: jawSize, y2: jawSize },
      isPrepared: false,
      statusMessage: `Status: ${size}x${size} Cone Applied`,
      statusType: 'idle'
    }));
    setConeModalOpen(false);
  };

  const handlePrepare = () => {
    if (!currentPatient) {
      alert("Please load a patient from the Schedule first.");
      return;
    }
    if (state.muSet <= 0) {
      setState(prev => ({ ...prev, statusMessage: "Status: Set MU First!", statusType: 'error' }));
      return;
    }
    setState(prev => ({
      ...prev,
      isPrepared: true,
      statusMessage: "Status: Prepared - Ready for Beam",
      statusType: 'active'
    }));
  };

  const handleBeamOn = () => {
    if (state.isDoorOpen) {
      setState(prev => ({ ...prev, statusMessage: "INTERLOCK: Door Open", statusType: 'error' }));
      return;
    }
    if (!state.isPrepared) return;

    setState(prev => ({
      ...prev,
      isBeaming: true,
      muDelivered: 0,
      statusMessage: "BEAM ON - RADIATION ACTIVE",
      statusType: 'warning'
    }));
  };

  const handleBeamOff = () => {
    if (beamIntervalRef.current) {
      window.clearInterval(beamIntervalRef.current);
      beamIntervalRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isBeaming: false,
      isPrepared: false,
      statusMessage: prev.muDelivered >= prev.muSet ? "Status: Treatment Complete" : "Status: Beam Interrupted",
      statusType: prev.muDelivered >= prev.muSet ? 'idle' : 'error'
    }));
  };

  const handleReset = () => {
    handleBeamOff();
    setState(prev => ({
      ...prev,
      isPrepared: false,
      muDelivered: 0,
      statusMessage: "Status: System Reset",
      statusType: 'idle'
    }));
  };

  const handleDoorToggle = () => {
    const newDoorState = !state.isDoorOpen;
    if (newDoorState && state.isBeaming) {
      handleBeamOff();
      setState(prev => ({ 
        ...prev, 
        isDoorOpen: true, 
        statusMessage: "INTERLOCK: Door Opened During Beam!", 
        statusType: 'error' 
      }));
    } else {
      setState(prev => ({
        ...prev,
        isDoorOpen: newDoorState,
        statusMessage: newDoorState ? "Status: Door Open" : "Status: Door Closed",
        statusType: newDoorState ? 'warning' : 'idle',
        isPrepared: newDoorState ? false : prev.isPrepared // Unprepare if door opens
      }));
    }
  };

  // Motion Controls
  const handleMoveGantry = (delta: number) => {
    setState(prev => ({ ...prev, gantryAngle: (prev.gantryAngle + delta + 360) % 360, isPrepared: false }));
  };
  const handleMoveCollimator = (delta: number) => {
    setState(prev => ({ ...prev, collimatorAngle: (prev.collimatorAngle + delta + 360) % 360, isPrepared: false }));
  };
  const handleMoveCouch = (delta: number) => {
    setState(prev => ({ ...prev, couchAngle: (prev.couchAngle + delta + 360) % 360, isPrepared: false }));
  };
  const handleAdjustJaw = (axis: keyof Jaws, delta: number) => {
    setState(prev => ({
      ...prev,
      jaws: { ...prev.jaws, [axis]: Math.max(0, parseFloat((prev.jaws[axis] + delta).toFixed(1))) },
      isPrepared: false
    }));
  };

  // Beam Loop Effect
  useEffect(() => {
    if (state.isBeaming) {
      beamIntervalRef.current = window.setInterval(() => {
        setState(prev => {
          if (!prev.isBeaming) return prev;
          
          const newDelivered = prev.muDelivered + 2; // Speed of delivery
          if (newDelivered >= prev.muSet) {
            // Finished
            if (beamIntervalRef.current) window.clearInterval(beamIntervalRef.current);
            return {
              ...prev,
              muDelivered: prev.muSet,
              isBeaming: false,
              isPrepared: false,
              statusMessage: "Status: Treatment Complete",
              statusType: 'idle' // Green/Idle state
            };
          }
          return { ...prev, muDelivered: newDelivered };
        });
      }, 100);
    }
    return () => {
      if (beamIntervalRef.current) window.clearInterval(beamIntervalRef.current);
    };
  }, [state.isBeaming, state.muSet]);

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans">
      <header className="bg-gradient-to-r from-blue-900 to-slate-800 text-white p-3 flex justify-between items-center shadow-md z-10 px-6">
        <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
          LINAC CONTROL CONSOLE
        </h1>
        <div className="text-xs font-mono text-gray-300">
          SYS_ID: LNC-01 | USER: RTT_STUDENT
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left: EMR */}
        <div className="w-1/4 min-w-[300px] z-0 shadow-xl border-r border-gray-300">
          <EmrPanel 
            currentPatient={currentPatient} 
            onLoadPatient={handleLoadPatient} 
            alignmentLogs={alignmentLogs}
            onClearLogs={() => setAlignmentLogs([])}
          />
        </div>

        {/* Center: Controls */}
        <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {!currentPatient && (
               <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 shadow-sm" role="alert">
                  <p className="font-bold">Workflow Paused</p>
                  <p>Please select a patient from the Schedule (left panel) to begin setup.</p>
              </div>
            )}

            <BeamControlPanel 
              state={state}
              onSetEnergy={handleSetEnergy}
              onSetMu={handleSetMu}
              onSetField={handleSetField}
              onPrepare={handlePrepare}
              onBeamOn={handleBeamOn}
              onBeamOff={handleBeamOff}
              onReset={handleReset}
              onDoorToggle={handleDoorToggle}
              onOverride={() => {}}
              onOpenConeModal={() => setConeModalOpen(true)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LinacControls 
                state={state}
                onMoveGantry={handleMoveGantry}
                onMoveCollimator={handleMoveCollimator}
                onMoveCouch={handleMoveCouch}
                onAdjustJaw={handleAdjustJaw}
              />
              {currentPatient ? (
                <ImageAlignmentPanel 
                  activeCaseId={currentPatient.alignmentCaseId}
                  patientId={currentPatient.id}
                  patientName={currentPatient.name}
                  onRecordAlignment={handleRecordAlignment}
                />
              ) : (
                <div className="bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 h-64 border-2 border-dashed border-gray-300">
                  Awaiting Patient Load for IGRT
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Readout */}
        <div className="w-1/5 min-w-[250px] z-0 shadow-lg border-l bg-white">
          <MachineReadout state={state} />
        </div>
      </div>

      <ConeSelectionModal 
        isOpen={isConeModalOpen} 
        onClose={() => setConeModalOpen(false)} 
        onSelect={handleConeSelect} 
      />
      
      {/* Footer Status Bar */}
      <div className="bg-slate-900 text-gray-400 text-xs py-1 px-4 flex justify-between items-center font-mono">
        <span>STATUS: {state.isBeaming ? 'RADIATION ACTIVE' : 'STANDBY'}</span>
        <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default App;