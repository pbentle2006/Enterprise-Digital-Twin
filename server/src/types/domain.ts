export interface GeologicalData {
  depth: number;
  formation: string;
  rockStrength: number; // psi
  porosity: number; // %
  permeability: number; // mD
  lithology: string;
  expectedROP: number; // ft/hr
  hardness: 'soft' | 'medium' | 'hard' | 'very_hard';
}

export interface NPTEvent {
  timestamp: Date;
  type: string;
  description: string;
  durationHours: number;
}

export interface HistoricalDrilling {
  wellId: string;
  bitType: string;
  depthIn: number;
  depthOut: number;
  hoursOnBottom: number;
  avgROP: number;
  costPerFoot: number;
  nptEvents: NPTEvent[];
  bitCondition: string;
}

export interface MaintenanceRecord {
  equipmentId: string;
  lastService: Date;
  serviceType: string;
  hoursOfOperation: number;
  predictedFailureRisk: number;
  componentCondition: Record<string, number>;
}

export interface PerformanceAlert {
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  type: string;
  description: string;
}

export interface DrillingKPIs {
  avgROP: number;
  costPerFoot: number;
  mechanicalSpecificEnergy: number;
  vibrationIndex: number;
}

export interface FormationPrediction {
  depthStart: number;
  depthEnd: number;
  hardness: GeologicalData['hardness'];
  confidence: number;
}

export interface DrillingParameters {
  weightOnBit: number;
  rotarySpeed: number;
  mudFlowRate: number;
}

export interface DrillabilityScore {
  score: number; // 0-100
  factors: Record<string, number>;
}

export interface FailurePrediction {
  equipmentId: string;
  risk: number; // 0-1
  etaHours: number;
  reasoning: string;
}

export interface Equipment { id: string; type: string; model: string }
export interface BitPerformance { type: string; hours: number; rop: number }
export interface MaintenanceSchedule { equipmentId: string; nextServiceInHours: number }
export interface BitRecommendation { changeNow: boolean; reason: string }

export interface AgentInsights { name: string; insights: any }
export interface DrillingStrategy { narrative: string; recommendedParams: DrillingParameters }
export interface DrillingConstraints { safetyFirst: boolean; maxTorque: number; wobRange: [number, number] }
export interface OptimizedParameters extends DrillingParameters { rationale: string }
export interface DrillingContext {
  currentDepth: number;
  recentSensors: any[];
  geology: GeologicalData[];
}
export interface AgentRecommendation { agent: string; priority: number; params?: DrillingParameters; message: string }
export interface ResolvedRecommendation extends AgentRecommendation { resolved: true }
export interface OrchestrationResult { decision: ResolvedRecommendation; metadata: Record<string, any> }
