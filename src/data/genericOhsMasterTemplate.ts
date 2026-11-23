export const OHS_TEMPLATE_PLACEHOLDERS = [
  "{{SITE_NAME}}",
  "{{BRAND_NETWORK}}",
  "{{SITE_CODE}}",
  "{{PHYSICAL_ADDRESS}}",
  "{{REGION_COUNTRY}}",
  "{{SECTION_16_2_MANAGER}}",
  "{{EMERGENCY_CONTACT}}",
  "{{TANK_COUNT}}",
  "{{DISPENSER_COUNT}}",
] as const;

export type OhsTemplatePlaceholder = (typeof OHS_TEMPLATE_PLACEHOLDERS)[number];

export interface SiteTemplateContext {
  siteName: string;
  brandNetwork: string;
  siteCode: string;
  physicalAddress: string;
  regionCountry: string;
  section162Manager: string;
  emergencyContact: string;
  tankCount: number;
  dispenserCount: number;
}

export interface OhsResponsibilityRow {
  task: string;
  responsible: string;
  frequency: string;
}

export interface OhsFieldRow {
  label: string;
  value: string;
}

export interface OhsIndexItem {
  number: number;
  element: string;
  section: string;
}

export interface OhsPolicySection {
  id: string;
  title: string;
  preamble: string;
  scope?: string;
  commitments: string[];
  employeeDuties: string[];
  signoffRoles: string[];
}

export interface OhsPpeRow {
  areaTask: string;
  minimumPpe: string;
}

export interface OhsLegalRegisterRow {
  id: string;
  legislation: string;
  keyRequirements: string;
}

export interface OhsLifeSavingRule {
  number: number;
  title: string;
  requirement: string;
  siteApplication: string;
}

export interface OhsAppointmentTemplate {
  id: string;
  title: string;
  legalReference: string;
  duties: string[];
  letterTemplate: string;
}

export type RiskBand = "Low" | "Medium" | "High" | "Critical";

export interface OhsRiskBandGuide {
  rating: RiskBand;
  scoreRange: string;
  actionRequired: string;
}

export interface OhsRiskAssessmentItem {
  id: string;
  area: string;
  activity: string;
  hazard: string;
  consequence: string;
  initialL: number;
  initialS: number;
  initialScore: number;
  initialBand: RiskBand;
  controls: string;
  residualL: number;
  residualS: number;
  residualScore: number;
  residualBand: RiskBand;
  responsible: string;
}

export interface OhsHazardousChemical {
  id: string;
  product: string;
  location: string;
  hazards: string;
  ppe: string;
}

export interface OhsSopItem {
  id: string;
  code: string;
  title: string;
  steps: string[];
}

export interface OhsEmergencyTeamRole {
  role: string;
  shiftCoverage: string;
}

export interface OhsEmergencyContactRow {
  service: string;
  numberOrRef: string;
}

export interface OhsSpecificEmergency {
  emergency: string;
  immediateActions: string;
}

export interface OhsIncidentReportingRule {
  what: string;
  reportTo: string;
  timeframe: string;
  reference: string;
}

export interface OhsChecklistItem {
  id: string;
  text: string;
  category: string;
}

export interface OhsInspectionChecklist {
  id: "daily" | "weekly" | "monthly";
  title: string;
  frequency: string;
  responsible: string;
  items: OhsChecklistItem[];
}

export interface OhsFirstAidItem {
  item: string;
  minQty: string;
}

export interface OhsSafetySignageItem {
  sign: string;
  requiredLocation: string;
}

export interface OhsRegisterSchema {
  id: string;
  title: string;
  subtitle: string;
  columns: string[];
}

export type TrainingRequirementCode = "R" | "A" | "O" | "";

export interface OhsTrainingMatrixRow {
  course: string;
  requirementsByRole: TrainingRequirementCode[];
  frequency: string;
}

export interface OhsToolboxTalkRow {
  monthLabel: string;
  topic1: string;
  topic2: string;
}

export interface OhsCertificateTemplate {
  heading: string;
  subheading: string;
  statement: string;
  regulatoryBasis: string;
  authorizedByLabel: string;
  footerNote: string;
}

export interface OhsEnvironmentalAspect {
  aspect: string;
  impact: string;
  control: string;
}

export interface OhsAuditScheduleRow {
  activity: string;
  byWhom: string;
  frequency: string;
}

export interface OhsMasterTemplate {
  schemaVersion: string;
  placeholders: readonly OhsTemplatePlaceholder[];
  meta: {
    documentTitle: string;
    subtitle: string;
    revision: string;
    governanceNote: string;
    confidentialityNote: string;
    maintenanceResponsibilities: OhsResponsibilityRow[];
  };
  siteProfileFields: OhsFieldRow[];
  siteFacilities: string[];
  complianceIndex: OhsIndexItem[];
  policies: OhsPolicySection[];
  minimumPpeMatrix: OhsPpeRow[];
  legalRegister: OhsLegalRegisterRow[];
  lifeSavingRules: OhsLifeSavingRule[];
  lifeSavingRulesConsequence: string[];
  appointmentTemplates: OhsAppointmentTemplate[];
  riskMatrix: {
    likelihoods: string[];
    severities: string[];
    bands: OhsRiskBandGuide[];
  };
  riskAssessments: OhsRiskAssessmentItem[];
  hazardousChemicals: OhsHazardousChemical[];
  ptraChecks: string[];
  safeWorkProcedures: OhsSopItem[];
  emergencyPlan: {
    intro: string;
    teamRoles: OhsEmergencyTeamRole[];
    contacts: OhsEmergencyContactRow[];
    evacuationProcedure: string[];
    specificEmergencies: OhsSpecificEmergency[];
    debriefFields: string[];
  };
  incidentManagement: {
    reportingRules: OhsIncidentReportingRule[];
    investigationProtocol: string[];
    registerColumns: string[];
  };
  inspectionChecklists: {
    daily: OhsInspectionChecklist;
    weekly: OhsInspectionChecklist;
    monthly: OhsInspectionChecklist;
  };
  equipmentRegisters: {
    firstAidMinimumContents: OhsFirstAidItem[];
    safetySignageRegister: OhsSafetySignageItem[];
    registerSchemas: OhsRegisterSchema[];
  };
  statutoryCertificates: string[];
  trainingAndInduction: {
    roles: string[];
    trainingMatrix: OhsTrainingMatrixRow[];
    inductionChecklist: string[];
    toolboxTalkSchedule: OhsToolboxTalkRow[];
    certificateTemplate: OhsCertificateTemplate;
  };
  governance: {
    committeeAgenda: string[];
    contractorMinimumRequirements: string[];
    section372Clauses: string[];
    permitWorkTypes: string[];
    permitPrecautions: string[];
    environmentalManagementPlan: OhsEnvironmentalAspect[];
    auditSchedule: OhsAuditScheduleRow[];
  };
}

function bandForScore(score: number): RiskBand {
  if (score <= 4) return "Low";
  if (score <= 9) return "Medium";
  if (score <= 14) return "High";
  return "Critical";
}

function makeRiskRow(
  id: string,
  area: string,
  activity: string,
  hazard: string,
  consequence: string,
  initialL: number,
  initialS: number,
  controls: string,
  residualL: number,
  residualS: number,
  responsible: string
): OhsRiskAssessmentItem {
  const initialScore = initialL * initialS;
  const residualScore = residualL * residualS;
  return {
    id,
    area,
    activity,
    hazard,
    consequence,
    initialL,
    initialS,
    initialScore,
    initialBand: bandForScore(initialScore),
    controls,
    residualL,
    residualS,
    residualScore,
    residualBand: bandForScore(residualScore),
    responsible,
  };
}

export const GENERIC_OHS_MASTER_TEMPLATE: OhsMasterTemplate = {
  schemaVersion: "ohs-master-template.v1",
  placeholders: OHS_TEMPLATE_PLACEHOLDERS,
  meta: {
    documentTitle: "Occupational Health & Safety Master File — {{SITE_NAME}}",
    subtitle: "{{BRAND_NETWORK}} Retail Service Station ({{SITE_CODE}})",
    revision: "Rev 01 — Active Master Template",
    governanceNote:
      "This OHS Master File is the active health and safety control record for {{SITE_NAME}} ({{SITE_CODE}}), operated under {{BRAND_NETWORK}} within {{REGION_COUNTRY}}. It must be kept accessible to shift supervisors, statutory inspectors, and auditors at all times, and communicated to all employees with proof of communication retained.",
    confidentialityNote:
      "Personal and medical surveillance records for {{SITE_NAME}} staff must be handled under applicable data protection legislation in {{REGION_COUNTRY}}, stored confidentially, and restricted to authorised personnel.",
    maintenanceResponsibilities: [
      {
        task: "Update appointments, registers and statutory certificates",
        responsible: "{{SECTION_16_2_MANAGER}} (16(2) Assigned Manager)",
        frequency: "Monthly and on change",
      },
      {
        task: "Complete daily / weekly / monthly safety inspections",
        responsible: "Shift Supervisor / {{SECTION_16_2_MANAGER}}",
        frequency: "As per checklist cadence",
      },
      {
        task: "File incident, near-miss and investigation reports",
        responsible: "Shift Supervisor and Incident Investigator",
        frequency: "Same day (before end of shift)",
      },
      {
        task: "Review baseline HIRA risk assessment and SOPs",
        responsible: "Risk Assessor with H&S Committee",
        frequency: "Annually and after incidents or changes",
      },
      {
        task: "Full OHS file governance review and sign-off",
        responsible: "16(1) Employer / Operator & {{SECTION_16_2_MANAGER}}",
        frequency: "Annually",
      },
    ],
  },
  siteProfileFields: [
    { label: "Site Name", value: "{{SITE_NAME}}" },
    { label: "Brand / Retail Network", value: "{{BRAND_NETWORK}}" },
    { label: "Site / Network Code", value: "{{SITE_CODE}}" },
    { label: "Physical Address", value: "{{PHYSICAL_ADDRESS}}" },
    { label: "Country / Regulatory Region", value: "{{REGION_COUNTRY}}" },
    { label: "16(2) Assigned Manager", value: "{{SECTION_16_2_MANAGER}}" },
    { label: "Primary Emergency Contact", value: "{{EMERGENCY_CONTACT}}" },
    { label: "Registered Underground Fuel Tanks", value: "{{TANK_COUNT}} tank(s)" },
    { label: "Active Forecourt Dispensers / Nozzles", value: "{{DISPENSER_COUNT}} unit(s)" },
    {
      label: "Type of Operation",
      value: "Retail fuel service station (petrol, diesel, kerosene), convenience shop, LPG cage (where fitted)",
    },
    { label: "Retail / Energy Operating Licence No.", value: "Insert statutory licence number for {{SITE_CODE}}" },
    { label: "Site Storage / Petroleum Licence No.", value: "Insert statutory site licence number" },
    { label: "Workers' Compensation / COIDA Reg. No.", value: "Insert valid registration number" },
    { label: "Company / Legal Entity Registration No.", value: "Insert operator registration number" },
    { label: "Trading Hours", value: "Insert trading hours (e.g. 24-hour / 05:00–22:00)" },
    { label: "Employee & Contractor Headcount", value: "Insert total permanent and shift staff count" },
    { label: "Designated Emergency Assembly Point", value: "Upwind perimeter clear of tanks, vents, and LPG cage" },
    { label: "GPS Coordinates", value: "Insert verified site latitude / longitude" },
  ],
  siteFacilities: [
    "Convenience Shop",
    "Kitchen / Bakery",
    "LPG Cylinder Cage",
    "Car Wash",
    "Workshop / Hoist",
    "Standby Generator",
    "ATM",
    "Air & Water Bay",
    "Staff & Customer Ablutions",
  ],
  complianceIndex: [
    { number: 1, element: "Document control, revision history & responsibilities", section: "Section 1" },
    { number: 2, element: "Site information, layout & evacuation route plan", section: "Section 2" },
    { number: 3, element: "OHS file index & compliance verification checklist", section: "Section 3" },
    { number: 4, element: "OHS policy (signed and displayed)", section: "Section 4" },
    { number: 5, element: "Alcohol and drug policy", section: "Section 4" },
    { number: 6, element: "Ergonomics policy", section: "Section 4" },
    { number: 7, element: "Emergency evacuation policy", section: "Section 4" },
    { number: 8, element: "Personal Protective Equipment (PPE) policy", section: "Section 4" },
    { number: 9, element: "Legal register (Acts, Regulations, SANS & regional codes)", section: "Section 5" },
    { number: 10, element: "12 Life Saving Rules — incorporated, communicated & acknowledged", section: "Section 6" },
    { number: 11, element: "Organogram and signed legal appointments with competence proof", section: "Section 7" },
    { number: 12, element: "Baseline HIRA risk assessment, risk matrix & hazardous chemical register", section: "Section 8" },
    { number: 13, element: "Pre-task risk assessment (PTRA / DSTI) forms", section: "Section 8" },
    { number: 14, element: "Safe work procedures (SOPs 9.1–9.13)", section: "Section 9" },
    { number: 15, element: "Emergency preparedness & response plan, contacts & drill records", section: "Section 10" },
    { number: 16, element: "Incident management: register, investigations, near misses & spill reports", section: "Section 11" },
    { number: 17, element: "Daily, weekly and monthly inspection checklists", section: "Section 12" },
    { number: 18, element: "Equipment registers: fire, first aid, ladders, electrical, PPE, signage", section: "Section 13" },
    { number: 19, element: "Training needs analysis, matrix, records & induction checklist", section: "Section 14" },
    { number: 20, element: "Toolbox talks schedule and attendance registers", section: "Section 14" },
    { number: 21, element: "H&S Committee constitution and meeting minutes", section: "Section 15" },
    { number: 22, element: "Contractor management: s37(2) agreements, permits to work & register", section: "Section 16" },
    { number: 23, element: "Occupational health, hygiene & medical surveillance records", section: "Section 17" },
    { number: 24, element: "Environmental management: waste register, oil/water separator & disposal certs", section: "Section 18" },
    { number: 25, element: "Statutory certificates & calibration compliance register", section: "Section 19" },
    { number: 26, element: "SHE assurance, audits, corrective actions & management of change", section: "Section 20" },
    { number: 27, element: "Proof of SHE file communication to employees", section: "Section 21" },
    { number: 28, element: "Statutory quick guides, safety posters & compliance annexures", section: "Sections 22–23" },
  ],
  policies: [
    {
      id: "ohs-policy",
      title: "Occupational Health and Safety (OHS) Policy — {{SITE_NAME}}",
      preamble:
        "Management at {{SITE_NAME}} ({{SITE_CODE}}, {{BRAND_NETWORK}}) is committed to Zero Harm to employees, contractors, customers, visitors, and the environment across {{REGION_COUNTRY}}. Operations adhere to statutory occupational health, environmental, and petroleum safety standards as well as the 12 {{BRAND_NETWORK}} Life Saving Rules.",
      scope:
        "Applies to every worker, contractor, delivery driver, and visitor across the forecourt ({{TANK_COUNT}} underground tanks, {{DISPENSER_COUNT}} dispensers), convenience shop, kitchen/bakery, LPG cage, storerooms, offices, ablutions, and auxiliary bays at {{PHYSICAL_ADDRESS}}.",
      commitments: [
        "Provide and maintain a safe working environment without risk to health as far as reasonably practicable.",
        "Identify hazards, assess risks, and apply the hierarchy of controls: eliminate, substitute, engineer, administer, then PPE.",
        "Enforce the 12 Life Saving Rules across all shifts; non-adherence triggers immediate stop-work and corrective action.",
        "Conduct pre-task risk assessments (PTRA / DSTI) for non-routine maintenance and verify critical controls in the field.",
        "Appoint competent supervisors and safety officials in writing and train every employee before starting duty.",
        "Issue task-appropriate PPE free of charge and maintain replacement stocks.",
        "Report every incident, spill, and near miss before the end of the shift and investigate root causes.",
        "Maintain readiness for fire, fuel spill, LPG leak, armed robbery, medical emergency, and evacuation.",
        "Prevent soil and groundwater pollution through daily wetstock reconciliation and oil/water separator maintenance.",
        "Consult workers through H&S Representatives and regular H&S Committee meetings.",
      ],
      employeeDuties: [
        "Take reasonable care for your own health and safety and that of colleagues and customers.",
        "Follow all SOPs, wetstock procedures, and Life Saving Rules; wear issued PPE correctly.",
        "Report unsafe acts, equipment defects, leaks, or injuries to {{SECTION_16_2_MANAGER}} or your shift supervisor immediately.",
        "Exercise the right to stop work believed to be unsafe and report it without victimisation.",
      ],
      signoffRoles: ["16(1) Employer / Operator", "{{SECTION_16_2_MANAGER}} (16(2) Manager)"],
    },
    {
      id: "alcohol-drug-policy",
      title: "Alcohol and Drug Zero-Tolerance Policy",
      preamble:
        "Entering {{SITE_NAME}} or operating fuel dispensing equipment while under the influence of alcohol or intoxicating drugs is strictly prohibited across all {{BRAND_NETWORK}} shifts.",
      commitments: [
        "Possession, sale, or consumption of alcohol or illegal substances on {{SITE_NAME}} premises is prohibited.",
        "Employees taking prescribed medication that may impair alertness must notify {{SECTION_16_2_MANAGER}} before shift handover.",
        "Alcohol screening may be performed at shift start, randomly, after incidents, or upon reasonable suspicion and logged in the test register.",
        "Any positive result or refusal to test requires immediate removal from safety-critical forecourt duties and disciplinary review.",
      ],
      employeeDuties: [
        "Report fit for duty at every shift across {{SITE_NAME}}.",
        "Cooperate with authorised workplace screening and disclose impairing prescriptions.",
      ],
      signoffRoles: ["16(1) Employer / Operator", "{{SECTION_16_2_MANAGER}} (16(2) Manager)"],
    },
    {
      id: "ergonomics-policy",
      title: "Ergonomics and Manual Handling Policy",
      preamble:
        "{{SITE_NAME}} prevents musculoskeletal injuries and shift fatigue by matching workstations, cashier counters, forecourt tasks, and stock handling to workers.",
      commitments: [
        "Review ergonomic risks across till points, forecourt islands, storerooms, kitchens, and offices every 2 years or upon layout change.",
        "Provide trolleys for lubricants, stock deliveries, and LPG cylinders; enforce team lifts above 20–25 kg.",
        "Supply anti-fatigue mats and seating where practicable for cashiers and adjustable workstation setups in the office.",
        "Rotate repetitive tasks and schedule statutory rest breaks across trading shifts.",
      ],
      employeeDuties: [
        "Use trolleys, step ladders, and lifting aids provided at {{SITE_NAME}}.",
        "Request assistance for awkward or heavy loads and report strain early.",
      ],
      signoffRoles: ["16(1) Employer / Operator", "{{SECTION_16_2_MANAGER}} (16(2) Manager)"],
    },
    {
      id: "emergency-evacuation-policy",
      title: "Emergency Evacuation Policy",
      preamble:
        "{{SITE_NAME}} protects the lives of staff, customers, tanker drivers, and contractors through structured planning, marked escape routes, and semi-annual evacuation drills.",
      commitments: [
        "Maintain a written Emergency Preparedness Plan covering fire, hydrocarbon spill, LPG leak, robbery, bomb threat, medical trauma, lightning, and flooding.",
        "Appoint an Emergency Coordinator, Forecourt and Shop Fire Marshals, First Aiders, and an Assembly Point Controller on every shift.",
        "Keep escape routes, emergency exits, and Emergency Shut-Off (ESD) buttons unobstructed, signed, and function-tested.",
        "Display evacuation maps and {{EMERGENCY_CONTACT}} numbers at the cashier kiosk, manager office, and forecourt.",
        "Conduct evacuation drills at least every 6 months across rotating shifts and document debrief corrective actions.",
      ],
      employeeDuties: [
        "Trigger ESD when instructed, stop dispensing, and guide customers upwind to the designated assembly point.",
        "Remain at the assembly point until headcount is verified and the Emergency Coordinator declares 'all clear'.",
      ],
      signoffRoles: ["16(1) Employer / Operator", "{{SECTION_16_2_MANAGER}} (16(2) Manager)"],
    },
    {
      id: "ppe-policy",
      title: "Personal Protective Equipment (PPE) Policy",
      preamble:
        "PPE serves as the final protective barrier after engineering and procedural controls. {{SITE_NAME}} issues compliant PPE free of charge.",
      commitments: [
        "Identify task-specific PPE through the baseline HIRA and display the PPE requirements matrix prominently.",
        "Provide PPE free of charge and replace damaged or worn items promptly through the PPE Issue Register.",
        "Verify compliant high-visibility, anti-static, chemical-resistant, and thermal protection standards.",
        "Train workers in correct inspection, use, cleaning, and storage of issued PPE.",
      ],
      employeeDuties: [
        "Wear required PPE correctly throughout forecourt, fuel offloading, LPG, kitchen, and cleaning duties.",
        "Report torn, contaminated, or ill-fitting PPE to your supervisor for immediate replacement.",
      ],
      signoffRoles: ["16(1) Employer / Operator", "{{SECTION_16_2_MANAGER}} (16(2) Manager)"],
    },
  ],
  minimumPpeMatrix: [
    { areaTask: "Forecourt (all attendants)", minimumPpe: "High-visibility reflective uniform / vest, closed safety shoes" },
    {
      areaTask: "Fuel delivery, tank dipping & spill clean-up",
      minimumPpe: "Reflective vest, nitrile chemical gloves, safety glasses, safety shoes",
    },
    { areaTask: "LPG cylinder handling & cage checks", minimumPpe: "Heavy-duty work gloves, steel-toe safety shoes" },
    { areaTask: "Kitchen / bakery (where fitted)", minimumPpe: "Apron, hair net, heat-resistant gloves for fryer/ovens, non-slip shoes" },
    { areaTask: "Cleaning with hazardous chemicals", minimumPpe: "Rubber/nitrile gloves, splash goggles, non-slip shoes" },
    { areaTask: "Car wash bay (where fitted)", minimumPpe: "Waterproof gumboots, gloves, goggles, waterproof apron" },
    { areaTask: "First aid response", minimumPpe: "Disposable nitrile/latex gloves, CPR pocket mouthpiece" },
  ],
  legalRegister: [
    {
      id: "leg-ohs-act",
      legislation: "Occupational Health & Safety Act (OHSA 85 of 1993 / {{REGION_COUNTRY}} OSH Statute)",
      keyRequirements: "Employer duty of care (s8), customer/contractor duty (s9), worker duties (s14), CEO/Manager appointments (s16), H&S reps/committees (s17–20), incident reporting (s24), contractor agreements (s37).",
    },
    {
      id: "leg-gar",
      legislation: "General Administrative Regulations (GAR 2003)",
      keyRequirements: "Statute access (Reg 4), H&S representative elections (Reg 5–6), incident reporting & Annexure 1 investigation records kept 3 years (Reg 8–9).",
    },
    {
      id: "leg-gsr",
      legislation: "General Safety Regulations (GSR)",
      keyRequirements: "PPE free issue (GSR 2), workplace intoxication ban (GSR 2A), first aid box & trained first aiders (GSR 3), flammable liquids (GSR 4), stacking (GSR 8), ladders (GSR 13A).",
    },
    {
      id: "leg-facilities",
      legislation: "Facilities & Workplace Environmental Regulations",
      keyRequirements: "Clean toilets, hand-wash stations, drinking water, change rooms, adequate forecourt/shop lighting, ventilation, fire precautions, and unobstructed exits.",
    },
    {
      id: "leg-hca",
      legislation: "Hazardous Chemical Agents Regulations (2021)",
      keyRequirements: "Chemical risk assessment, current Safety Data Sheets (SDSs), container labelling, benzene vapour exposure controls, and worker training.",
    },
    {
      id: "leg-elec-inst",
      legislation: "Electrical Installation & Machinery Regulations",
      keyRequirements: "Valid Electrical Certificate of Compliance (COC), registered electricians only, locked/labelled DBs, monthly earth-leakage testing, explosion-protected gear in zoned fuel areas.",
    },
    {
      id: "leg-pressure",
      legislation: "Pressure Equipment Regulations",
      keyRequirements: "Periodic inspection and testing of air compressors and fixed LPG installations.",
    },
    {
      id: "leg-machinery",
      legislation: "Driven Machinery Regulations (if workshop hoist fitted)",
      keyRequirements: "Annual inspection and load-testing certificates for vehicle hoists and lifting equipment.",
    },
    {
      id: "leg-ergonomics",
      legislation: "Ergonomics Regulations (2019)",
      keyRequirements: "Biennial ergonomic risk assessment of forecourt, cashier, storeroom, kitchen, and office tasks.",
    },
    {
      id: "leg-construction",
      legislation: "Construction & Contractor Safety Regulations",
      keyRequirements: "Contractor SHE files, risk assessments, fall protection, excavation permits, and permit-to-work verification.",
    },
    {
      id: "leg-coida",
      legislation: "Workers' Compensation / COIDA 130 of 1993 ({{REGION_COUNTRY}} Equivalent)",
      keyRequirements: "Valid registration and Letter of Good Standing; report injuries on duty within 7 days and occupational diseases within 14 days.",
    },
    {
      id: "leg-labour",
      legislation: "Basic Conditions of Employment / {{REGION_COUNTRY}} Labour Code",
      keyRequirements: "Shift rosters, maximum hours, overtime, night-work allowances & safety briefings, rest intervals, and 3-year time/pay records.",
    },
    {
      id: "leg-env",
      legislation: "National Environmental Management & Waste Acts (NEMA / {{REGION_COUNTRY}} EPA/NEMA/NEMC)",
      keyRequirements: "Duty of care against soil/water contamination, immediate reporting of major fuel spills, licensed hazardous waste transporters, and safe disposal certificates.",
    },
    {
      id: "leg-petrol",
      legislation: "Petroleum Products Licensing & Wetstock Governance ({{REGION_COUNTRY}} Energy Authority)",
      keyRequirements: "Valid site and retail petroleum licences, product grade integrity, and calibrated dispenser/tank reconciliation.",
    },
    {
      id: "leg-sans-10400",
      legislation: "Building & Fire Protection Standards (SANS 10400-T / Local Fire Code)",
      keyRequirements: "Fire resistance, emergency lighting, illuminated exit routes, and local fire authority flammable substance certificate.",
    },
    {
      id: "leg-sans-10089",
      legislation: "SANS 10089-3 (Petroleum Service Station Storage & Distribution)",
      keyRequirements: "Underground storage tank integrity, calibrated wooden dipsticks / ATG gauging, hazardous zone control, vapour vents, and spill containment.",
    },
    {
      id: "leg-sans-10087",
      legislation: "SANS 10087-1 / 10087-7 (LPG Retail Storage & Cylinders)",
      keyRequirements: "Ventilated, locked outdoor LPG cage within approved capacity, minimum safety distances, upright storage, and leak inspection.",
    },
    {
      id: "leg-sans-10105",
      legislation: "SANS 10105-1 / SANS 1475-1 (Fire Extinguisher Selection & Servicing)",
      keyRequirements: "Correct DCP/CO2/Class F placement at islands and kitchen, monthly visual checks, and annual accredited servicing.",
    },
    {
      id: "leg-sans-1186",
      legislation: "SANS 1186 (Symbolic Safety Signage)",
      keyRequirements: "Legible No Smoking, Engine Off, No Cell Phones, Emergency Stop, Fire, PPE, Assembly Point, and Speed Limit signage.",
    },
    {
      id: "leg-food",
      legislation: "Food Premises Hygiene & Safety Standards (R638 / Local Health Authority)",
      keyRequirements: "Certificate of Acceptability (if food/bakery present), food handler training, cold/hot temperature logs, and pest control.",
    },
    {
      id: "leg-tobacco",
      legislation: "Tobacco & Ignition Control Regulations",
      keyRequirements: "Strict ban on smoking, vaping, and open flames across the forecourt, tank fill points, and indoor work areas.",
    },
    {
      id: "leg-privacy",
      legislation: "Data Protection & Medical Record Confidentiality ({{REGION_COUNTRY}} Privacy Law / POPIA)",
      keyRequirements: "Secure storage of employee ID copies, CCTV footage, and sealed medical surveillance files.",
    },
    {
      id: "leg-metrology",
      legislation: "Legal Metrology & Dispenser Calibration Standards",
      keyRequirements: "Periodic pump meter verification, calibration seals intact, and accurate tank strapping charts.",
    },
    {
      id: "leg-network-she",
      legislation: "{{BRAND_NETWORK}} SHE Specification & 12 Life Saving Rules",
      keyRequirements: "Mandatory site integration of Life Saving Rules, pre-task risk assessments, wetstock trigger gates, and contractor permit controls.",
    },
  ],
  lifeSavingRules: [
    {
      number: 1,
      title: "Lock-out and isolation",
      requirement: "Follow the lock-out and isolation procedure before maintenance or repair work begins.",
      siteApplication: "Isolate dispensers, submersible pumps, and electrical DBs with lock & tag before work at {{SITE_NAME}}.",
    },
    {
      number: 2,
      title: "Personal protective equipment",
      requirement: "Wear the correct task-specific PPE properly at all times.",
      siteApplication: "Reflective uniform and safety shoes on forecourt; nitrile gloves and eye protection during dipping and spills.",
    },
    {
      number: 3,
      title: "Alcohol and drugs",
      requirement: "Entering the workplace or working under the influence of alcohol or drugs is strictly prohibited.",
      siteApplication: "Zero tolerance with pre-shift, random, and post-incident screening logged in the site register.",
    },
    {
      number: 4,
      title: "Adhere to procedures",
      requirement: "Follow prescribed safe work procedures before, during, and after every task.",
      siteApplication: "Mandatory adherence to fuel delivery, dipstick gauging, spill response, cash-up, and LPG SOPs.",
    },
    {
      number: 5,
      title: "Heavy mobile equipment / vehicles",
      requirement: "Maintain a safe exclusion zone around operational tankers and heavy vehicles.",
      siteApplication: "Never stand behind reversing road tankers or delivery trucks; barricade offloading bays.",
    },
    {
      number: 6,
      title: "Excavation / ground disturbance",
      requirement: "Obtain excavation clearance and permit authorisation before breaking ground.",
      siteApplication: "Strictly required for contractor trenching near underground tanks, fuel lines, or electrical cables.",
    },
    {
      number: 7,
      title: "Working at heights",
      requirement: "Use approved fall protection and inspected access gear when working at height.",
      siteApplication: "Canopy, price-sign, lighting, and roof work above 2 m restricted to certified contractors with fall-arrest plans.",
    },
    {
      number: 8,
      title: "Road and forecourt traffic safety",
      requirement: "Obey traffic lanes, pedestrian walkways, and site speed limits.",
      siteApplication: "Control vehicle entry/exit flows and wear high-visibility attire on all {{DISPENSER_COUNT}} dispenser lanes.",
    },
    {
      number: 9,
      title: "Permit to work",
      requirement: "Obtain an authorised Permit to Work before starting non-routine or hazardous maintenance.",
      siteApplication: "Mandatory for all contractor work in zoned fuel areas, electrical panels, heights, or hot work.",
    },
    {
      number: 10,
      title: "Lifting operations",
      requirement: "Follow safe lifting controls and never work under suspended loads.",
      siteApplication: "Certified rigging for pump/tank equipment lifts; observe manual handling limits for stock and LPG.",
    },
    {
      number: 11,
      title: "Confined space entry",
      requirement: "Never enter a confined space without a valid permit, gas testing, and rescue plan.",
      siteApplication: "Site attendants and supervisors at {{SITE_NAME}} NEVER enter underground tanks, sumps, or manholes.",
    },
    {
      number: 12,
      title: "Ignition sources / flammable atmosphere",
      requirement: "Keep all ignition sources out of flammable zones; stop work immediately if vapour is detected.",
      siteApplication: "Enforce engine-off, no smoking, no cell phones at dispensers, earth bonding on tankers, and hot-work permits.",
    },
  ],
  lifeSavingRulesConsequence: [
    "Any employee, supervisor, or contractor observing a Life Saving Rule violation has the duty and authority to STOP work immediately.",
    "Every violation must be logged as a safety incident and investigated by {{SECTION_16_2_MANAGER}} before the task resumes.",
    "Employees who deliberately breach a Life Saving Rule face formal disciplinary action; coaching is provided for system gaps.",
    "Contractors who breach a Life Saving Rule are stood down immediately, removed from {{SITE_NAME}}, and reported to {{BRAND_NETWORK}}.",
  ],
  appointmentTemplates: [
    {
      id: "appt-16-1",
      title: "16(1) Employer / Operator Accountability",
      legalReference: "OHS Act s16(1) ({{REGION_COUNTRY}} Statutory Equivalent)",
      duties: [
        "Assume overall statutory accountability for occupational health, safety, and environmental compliance at {{SITE_NAME}} ({{SITE_CODE}}).",
        "Allocate sufficient budget, training, PPE, and maintenance resources to uphold the OHS policy.",
        "Appoint the 16(2) Assigned Manager ({{SECTION_16_2_MANAGER}}) in writing and review annual OHS governance.",
      ],
      letterTemplate:
        "STATUTORY RECORD — SECTION 16(1) EMPLOYER ACCOUNTABILITY\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Network: {{BRAND_NETWORK}}\nAddress: {{PHYSICAL_ADDRESS}} | Jurisdiction: {{REGION_COUNTRY}}\n\nIn terms of Section 16(1) of the Occupational Health & Safety Act, the Operator / Chief Executive Officer retains overarching accountability for ensuring safe forecourt operations across {{TANK_COUNT}} underground tanks and {{DISPENSER_COUNT}} dispensers, delegating operational execution to {{SECTION_16_2_MANAGER}}.",
    },
    {
      id: "appt-16-2",
      title: "16(2) Assigned Manager",
      legalReference: "OHS Act s16(2)",
      duties: [
        "Act on behalf of the 16(1) Employer to execute duties in terms of OHS Act s8 and s9 across {{SITE_NAME}}.",
        "Maintain this OHS Master File current, ensuring legal appointments, wetstock logs, and statutory certificates never lapse.",
        "Ensure baseline HIRA risk assessments, SOPs, and {{BRAND_NETWORK}} Life Saving Rules are enforced on every shift.",
        "Chair the H&S Committee, manage incident investigations, and report statutory events within required timelines.",
        "Control contractors through s37(2) mandatary agreements and the Permit-to-Work system.",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — SECTION 16(2) ASSIGNED MANAGER\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Network: {{BRAND_NETWORK}}\nAddress: {{PHYSICAL_ADDRESS}} | Region: {{REGION_COUNTRY}}\n\nTo: {{SECTION_16_2_MANAGER}}\nYou are hereby appointed in terms of OHS Act s16(2) as Assigned Manager for {{SITE_NAME}} ({{TANK_COUNT}} tanks / {{DISPENSER_COUNT}} dispensers). You are authorised to allocate resources, enforce the 12 Life Saving Rules, approve corrective actions, and oversee statutory reporting.\n\nAppointed by (16(1) Employer): ______________________  Date: ____________\nAccepted by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________",
    },
    {
      id: "appt-supervisor",
      title: "Shift Supervisor",
      legalReference: "OHS Act s8(2)(i)",
      duties: [
        "Supervise forecourt and shop staff on your assigned shift to ensure compliance with SOPs and Life Saving Rules.",
        "Complete daily and weekly inspection checklists and log defects immediately.",
        "Conduct pre-shift toolbox talks and verify PTRAs for non-routine work.",
        "Report and record all incidents, near misses, and wetstock variances before shift close.",
        "Oversee tanker deliveries and contractor activities on shift; halt any unsafe act.",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — SHIFT SUPERVISOR (OHS ACT s8(2)(i))\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Manager: {{SECTION_16_2_MANAGER}}\n\nTo: ______________________ (ID: ______________________)\nYou are appointed as Shift Supervisor at {{SITE_NAME}} ({{PHYSICAL_ADDRESS}}). You will oversee shift compliance, daily checklists, wetstock variance checks, and Life Saving Rules enforcement.\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
    {
      id: "appt-hs-rep",
      title: "Health and Safety Representative",
      legalReference: "OHS Act s17 & s18; GAR Reg 6",
      duties: [
        "Review effectiveness of workplace health and safety measures at {{SITE_NAME}}.",
        "Conduct monthly workplace inspections and record findings for the H&S Committee.",
        "Participate in incident investigations, near-miss reviews, and staff safety consultations.",
        "Represent employees on safety concerns without fear of victimisation.",
      ],
      letterTemplate:
        "LETTER OF DESIGNATION — H&S REPRESENTATIVE (OHS ACT s17–18)\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Region: {{REGION_COUNTRY}}\n\nTo: ______________________ (ID: ______________________)\nFollowing employee nomination/election, you are designated as Health & Safety Representative for {{SITE_NAME}} for a term of ___ years. You will conduct monthly inspections and participate in H&S Committee reviews.\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
    {
      id: "appt-committee",
      title: "H&S Committee Member",
      legalReference: "OHS Act s19 & s20",
      duties: [
        "Attend H&S Committee meetings at least quarterly (monthly best practice at {{SITE_NAME}}).",
        "Review inspection findings, wetstock/environmental risks, incidents, training completion, and close-out of corrective actions.",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — H&S COMMITTEE MEMBER (OHS ACT s19–20)\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Network: {{BRAND_NETWORK}}\n\nTo: ______________________\nYou are appointed to the Health & Safety Committee of {{SITE_NAME}}, chaired by {{SECTION_16_2_MANAGER}}, to review incidents, inspections, and workplace safety recommendations.\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
    {
      id: "appt-first-aider",
      title: "First Aider",
      legalReference: "General Safety Regulation 3",
      duties: [
        "Maintain an accredited Level 1 (minimum) First Aid certificate renewed every 3 years.",
        "Render immediate first aid and log every case in the First Aid Treatment Register.",
        "Inspect and restock the first aid box weekly against the statutory contents list.",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — FIRST AIDER (GSR 3)\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Emergency Contact: {{EMERGENCY_CONTACT}}\n\nTo: ______________________ (Cert No. & Expiry: ______________________)\nYou are appointed as First Aider for {{SITE_NAME}}. You are responsible for emergency first aid response, weekly kit verification, and treatment logging.\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
    {
      id: "appt-emerg-coord",
      title: "Emergency Coordinator / Chief Fire Marshal",
      legalReference: "OHS Act s8; Environmental Regs for Workplaces Reg 9",
      duties: [
        "Take command during site emergencies and evacuations; trigger Emergency Shut-Off (ESD) and contact {{EMERGENCY_CONTACT}}.",
        "Account for all staff, customers, and contractors at the upwind assembly point.",
        "Organise evacuation drills every 6 months and document debrief corrective actions.",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — EMERGENCY COORDINATOR / CHIEF FIRE MARSHAL\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Physical Address: {{PHYSICAL_ADDRESS}}\n\nTo: ______________________\nYou are appointed Emergency Coordinator for {{SITE_NAME}}, overseeing emergency drills, ESD readiness, evacuation sweep, and external responder liaison ({{EMERGENCY_CONTACT}}).\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
    {
      id: "appt-fire-marshal",
      title: "Fire Marshal / Fire Fighter",
      legalReference: "Environmental Regs for Workplaces Reg 9; SANS 10105-1",
      duties: [
        "Maintain basic fire-fighting competence and respond safely to incipient fires using appropriate Class B/C/F media.",
        "Inspect all fire extinguishers, fire blankets, and hose reels monthly (gauge, seal, service tag, clear access).",
        "Sweep assigned forecourt or shop zones during evacuation.",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — FIRE MARSHAL (SANS 10105-1)\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Tanks: {{TANK_COUNT}} | Dispensers: {{DISPENSER_COUNT}}\n\nTo: ______________________ (Fire Cert Expiry: ______________________)\nYou are appointed Fire Marshal at {{SITE_NAME}}, responsible for monthly extinguisher checks and emergency evacuation sweeps.\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
    {
      id: "appt-investigator",
      title: "Incident Investigator",
      legalReference: "GAR Reg 9 (Annexure 1)",
      duties: [
        "Investigate every injury, near miss, spill, robbery, and Life Saving Rule breach with the H&S Representative.",
        "Apply 5-Whys root-cause analysis, log corrective actions, and share learnings across shifts and {{BRAND_NETWORK}}.",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — INCIDENT INVESTIGATOR (GAR REG 9)\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Network: {{BRAND_NETWORK}}\n\nTo: ______________________\nYou are appointed Incident Investigator for {{SITE_NAME}}, reporting investigation findings and corrective actions to {{SECTION_16_2_MANAGER}}.\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
    {
      id: "appt-risk-assessor",
      title: "Risk Assessor",
      legalReference: "OHS Act s8(2)(d); Hazardous Chemical Agents Regs 2021",
      duties: [
        "Facilitate annual baseline HIRA reviews and task-specific / Management-of-Change risk assessments.",
        "Maintain the Hazardous Chemical Register, Safety Data Sheets (SDS), and fuel-vapour exposure controls.",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — RISK ASSESSOR (OHS ACT s8(2)(d))\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Region: {{REGION_COUNTRY}}\n\nTo: ______________________\nYou are appointed Risk Assessor for {{SITE_NAME}}, maintaining the baseline HIRA, PTRA system, and hazardous chemical SDS file.\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
    {
      id: "appt-stacking",
      title: "Stacking and Storage Supervisor",
      legalReference: "General Safety Regulation 8",
      duties: [
        "Maintain safe storeroom and cold-room stacking: heavy stock low, stable tiers, within rack load limits.",
        "Keep aisles, electrical DBs, and fire exits 100% unobstructed and inspect storage weekly.",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — STACKING & STORAGE SUPERVISOR (GSR 8)\nSite: {{SITE_NAME}} ({{SITE_CODE}})\n\nTo: ______________________\nYou are appointed Stacking & Storage Supervisor at {{SITE_NAME}} to enforce safe warehousing, shelf limits, and clear escape aisles.\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
    {
      id: "appt-ladder",
      title: "Ladder Inspector",
      legalReference: "General Safety Regulation 13A",
      duties: [
        "Uniquely number, inspect monthly, and record all portable ladders in the Ladder Register.",
        "Immediately quarantine defective ladders and refer work above 2 m for fall-protection controls.",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — LADDER INSPECTOR (GSR 13A)\nSite: {{SITE_NAME}} ({{SITE_CODE}})\n\nTo: ______________________\nYou are appointed Ladder Inspector for {{SITE_NAME}} to conduct monthly ladder safety inspections and remove unsafe equipment from service.\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
    {
      id: "appt-electrical",
      title: "Electrical Equipment Controller",
      legalReference: "Electrical Installation Regs 2009; Electrical Machinery Regs 2011",
      duties: [
        "Verify valid Electrical COC is on file and ensure only registered electricians work on installations.",
        "Test earth-leakage units monthly, inspect portable appliances, and enforce Life Saving Rule 1 (Lock-Out/Tag-Out).",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — ELECTRICAL EQUIPMENT CONTROLLER\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Tanks: {{TANK_COUNT}} | Dispensers: {{DISPENSER_COUNT}}\n\nTo: ______________________\nYou are appointed Electrical Equipment Controller for {{SITE_NAME}} to oversee portable appliance checks, monthly earth-leakage tests, and DB lock-out controls.\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
    {
      id: "appt-lpg",
      title: "LPG Safety Controller",
      legalReference: "SANS 10087-7; Pressure Equipment Regs 2009",
      duties: [
        "Ensure LPG cylinders are stored upright in the locked, ventilated outdoor cage within licensed quantity limits.",
        "Inspect cylinder seals, soapy-water leak checks, safety signage, and DCP extinguisher availability.",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — LPG SAFETY CONTROLLER (SANS 10087-7)\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Address: {{PHYSICAL_ADDRESS}}\n\nTo: ______________________\nYou are appointed LPG Safety Controller at {{SITE_NAME}} to enforce cage security, safe handling, leak inspections, and storage limits.\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
    {
      id: "appt-fuel-delivery",
      title: "Fuel Delivery (Offloading) Controller",
      legalReference: "SANS 10089-3; {{BRAND_NETWORK}} Fuel Receiving SOP 9.2",
      duties: [
        "Supervise every bulk tanker offloading across {{SITE_NAME}}'s {{TANK_COUNT}} underground tanks.",
        "Perform pre-drop and post-drop dips, confirm ullage, connect earth-bonding cable, stage extinguishers, and barricade the fill zone.",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — FUEL DELIVERY CONTROLLER (SANS 10089-3)\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Network: {{BRAND_NETWORK}} | Tanks: {{TANK_COUNT}}\n\nTo: ______________________\nYou are appointed Fuel Delivery Controller for {{SITE_NAME}}, authorised to verify product grades, pre/post-drop dipstick readings, ullage margins, and exclusion zones during tanker offloads.\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
    {
      id: "appt-contractor",
      title: "Contractor Coordinator",
      legalReference: "OHS Act s37(2); Construction Regs 2014",
      duties: [
        "Verify every contractor holds a signed s37(2) agreement, valid compensation LoGS, SHE file, and site induction before work.",
        "Issue and close out Permits to Work and monitor adherence to Life Saving Rules.",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — CONTRACTOR COORDINATOR (OHS ACT s37(2))\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Manager: {{SECTION_16_2_MANAGER}}\n\nTo: ______________________\nYou are appointed Contractor Coordinator at {{SITE_NAME}} to manage s37(2) mandatary agreements, contractor inductions, and Permit-to-Work close-out.\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
    {
      id: "appt-food",
      title: "Food Safety Person in Charge",
      legalReference: "Food Premises Hygiene Standard (R638 / Regional Equivalent)",
      duties: [
        "Ensure food preparation areas hold a valid Certificate of Acceptability and food handlers complete hygiene training.",
        "Monitor daily cold/hot holding temperatures, pest control records, and kitchen cleaning schedules.",
      ],
      letterTemplate:
        "LETTER OF APPOINTMENT — FOOD SAFETY PERSON IN CHARGE\nSite: {{SITE_NAME}} ({{SITE_CODE}}) | Region: {{REGION_COUNTRY}}\n\nTo: ______________________\nYou are appointed Food Safety Person in Charge for {{SITE_NAME}} food/bakery operations (where applicable), overseeing temperature logs, sanitation, and food handler compliance.\n\nAppointed by ({{SECTION_16_2_MANAGER}}): ______________________  Date: ____________\nAccepted by Appointee: ______________________  Date: ____________",
    },
  ],
  riskMatrix: {
    likelihoods: ["1 Rare", "2 Unlikely", "3 Possible", "4 Likely", "5 Almost Certain"],
    severities: [
      "1 Insignificant",
      "2 Minor (First Aid)",
      "3 Moderate (Medical / Lost Time)",
      "4 Major (Permanent Disability)",
      "5 Catastrophic (Fatality / Explosion)",
    ],
    bands: [
      { rating: "Low", scoreRange: "1 – 4", actionRequired: "Acceptable. Manage through routine SOPs and monitor." },
      { rating: "Medium", scoreRange: "5 – 9", actionRequired: "Tolerable with controls. Supervisor verifies controls; review annually." },
      {
        rating: "High",
        scoreRange: "10 – 14",
        actionRequired: "Additional controls required before work continues. {{SECTION_16_2_MANAGER}} approves 7-day action plan.",
      },
      {
        rating: "Critical",
        scoreRange: "15 – 25",
        actionRequired: "STOP WORK immediately until risk is mitigated. Escalate to 16(1) Employer and {{BRAND_NETWORK}}.",
      },
    ],
  },
  riskAssessments: [
    makeRiskRow(
      "ra-01",
      "Forecourt",
      "Fuel dispensing",
      "Petrol vapour with ignition source (smoking, cell phones, static, running engines)",
      "Fire / explosion, burns, fatality",
      3,
      5,
      "LSR 12 enforced; no-smoking & no-phone signs at every island; engines off before fuelling; ESD buttons tested weekly; 9 kg DCP extinguishers staged; staff fire training",
      1,
      5,
      "Shift Supervisor"
    ),
    makeRiskRow(
      "ra-02",
      "Forecourt",
      "Fuel dispensing",
      "Skin / eye contact with fuel, nozzle splash-back",
      "Dermatitis, chemical eye injury",
      3,
      2,
      "Auto shut-off nozzles maintained; nitrile gloves for spill wipes; eyewash station stocked; SDS on file; wash hands before eating",
      2,
      2,
      "Shift Supervisor"
    ),
    makeRiskRow(
      "ra-03",
      "Forecourt",
      "Fuel dispensing",
      "Dispensing fuel into unapproved containers (e.g. thin plastic bottles)",
      "Static flash fire, misuse",
      3,
      4,
      "Dispense only into approved labelled containers placed flat on the ground; strict refusal protocol; island signage",
      1,
      4,
      "Forecourt Attendants"
    ),
    makeRiskRow(
      "ra-04",
      "Forecourt",
      "Moving vehicles & pedestrians",
      "Struck by customer car, truck, or tanker",
      "Crush injury / fatality",
      3,
      5,
      "LSR 5 & 8; high-vis reflective uniforms; painted walkways & speed humps; never stand behind reversing vehicles; night floodlighting",
      2,
      4,
      "Shift Supervisor"
    ),
    makeRiskRow(
      "ra-05",
      "Forecourt",
      "Bulk fuel delivery (tanker offloading)",
      "Tank overfill, grade mix-up, hose spill, vapour release, tanker drive-away",
      "Explosion, groundwater pollution, injury",
      3,
      5,
      "SOP 9.2; appointed Offloading Controller present; pre/post dips & ullage check; earth-bonding connected; barricaded zone; DCP extinguishers & spill kit staged",
      1,
      5,
      "Fuel Delivery Controller"
    ),
    makeRiskRow(
      "ra-06",
      "Forecourt",
      "Tank dipping / wetstock checks",
      "Benzene vapour inhalation; open manhole trip hazard; manual bending",
      "Occupational exposure, trip, back strain",
      3,
      3,
      "Stand upwind; calibrated wooden dipstick or electronic ATG; replace caps & manhole lids immediately; ergonomic lifting posture",
      2,
      2,
      "Shift Supervisor"
    ),
    makeRiskRow(
      "ra-07",
      "Forecourt",
      "Tank, sump & manhole work",
      "Confined space: toxic / flammable / oxygen-deficient atmosphere",
      "Asphyxiation, explosion, fatality",
      2,
      5,
      "LSR 9 & 11: site staff NEVER enter tanks or sumps; only {{BRAND_NETWORK}}-approved contractors with Permit to Work, gas testing & rescue plan",
      1,
      5,
      "{{SECTION_16_2_MANAGER}}"
    ),
    makeRiskRow(
      "ra-08",
      "Forecourt",
      "Fuel spill response",
      "Flammable slick on apron, slips, stormwater drain run-off",
      "Fire, slip injury, environmental prosecution",
      3,
      4,
      "SOP 9.3; spill kits at islands & fill point; hit ESD; eliminate ignition; deploy hydrophobic booms before drains; separator maintained",
      1,
      4,
      "Shift Supervisor"
    ),
    makeRiskRow(
      "ra-09",
      "Forecourt",
      "Air & water / tyre inflation",
      "Tyre over-inflation, sidewall burst, compressed-air injury",
      "Impact trauma",
      2,
      3,
      "Calibrated pressure gauge; compressor inspected per Pressure Equipment Regs; staff prohibited from inflating damaged tyres",
      1,
      3,
      "Shift Supervisor"
    ),
    makeRiskRow(
      "ra-10",
      "All areas",
      "Cash handling / night shift",
      "Armed robbery, assault, hostage risk",
      "Psychological trauma, severe injury, fatality",
      4,
      5,
      "SOP 9.8; drop safe & minimal till cash; CCTV; panic buttons linked to armed response; perimeter lighting; do-not-resist training; trauma counselling",
      2,
      5,
      "{{SECTION_16_2_MANAGER}}"
    ),
    makeRiskRow(
      "ra-11",
      "All areas",
      "Customer conflict",
      "Verbal abuse or physical aggression",
      "Assault injury, acute stress",
      3,
      3,
      "De-escalation training; supervisor backup; panic button; CCTV coverage; formal incident logging",
      2,
      3,
      "Shift Supervisor"
    ),
    makeRiskRow(
      "ra-12",
      "All areas",
      "Electrical installation & equipment",
      "Electric shock; spark ignition in hazardous zoned areas",
      "Electrocution, hydrocarbon fire",
      2,
      5,
      "LSR 1; valid Electrical COC; licensed electricians only; Ex-rated gear in fuel zones; DBs locked & labelled; monthly earth-leakage tests",
      1,
      5,
      "Electrical Controller"
    ),
    makeRiskRow(
      "ra-13",
      "LPG cage",
      "LPG cylinder storage & exchange",
      "Gas leak, vapour accumulation, fire / BLEVE explosion",
      "Severe burns, fatality, structural loss",
      3,
      5,
      "Ventilated locked cage per SANS 10087-7 within quantity cap; safety distances enforced; DCP extinguisher; upright valves closed; soapy leak checks",
      1,
      5,
      "LPG Safety Controller"
    ),
    makeRiskRow(
      "ra-14",
      "LPG cage / storeroom",
      "Handling cylinders & stock",
      "Manual handling strain; dropped heavy loads",
      "Lumbar injury, crushed toes",
      3,
      3,
      "Hand trolley for 19 kg+ cylinders; two-person lift for 48 kg; steel-toe safety shoes; heavy stock stored waist-to-knee height",
      2,
      2,
      "Shift Supervisor"
    ),
    makeRiskRow(
      "ra-15",
      "Convenience Shop",
      "Cleaning, beverage spills, wet floors",
      "Slips, trips and falls",
      "Fractures, sprains",
      3,
      3,
      "Wet-floor cones deployed; clean-as-you-go; non-slip footwear; entrance barrier mats; clear aisles",
      2,
      2,
      "Shift Supervisor"
    ),
    makeRiskRow(
      "ra-16",
      "Storeroom",
      "Stacking stock / using ladders",
      "Falling cartons; fall from defective ladder",
      "Head trauma, fractures",
      3,
      4,
      "GSR 8 stacking height & load limits; monthly inspected ladders (GSR 13A); 3-point contact; fall arrest required above 2 m (LSR 7)",
      1,
      4,
      "Stacking Supervisor"
    ),
    makeRiskRow(
      "ra-17",
      "Kitchen / bakery",
      "Deep fryers, ovens, hot surfaces",
      "Hot-oil splash burns, fat fire",
      "Severe thermal burns, kitchen fire",
      3,
      4,
      "Heat-resistant gloves & apron; thermostat oil controls; never leave fryer unattended; fire blanket & Class F wet-chemical extinguisher; clean filters",
      2,
      3,
      "Food Safety PIC"
    ),
    makeRiskRow(
      "ra-18",
      "Kitchen / bakery",
      "Knives, slicers, mixers",
      "Blade lacerations, moving-part entanglement",
      "Severe cuts, amputation",
      3,
      3,
      "Machine guards intact; switch off & unplug before cleaning; cut-resistant glove; authorised trained operators only",
      2,
      2,
      "Food Safety PIC"
    ),
    makeRiskRow(
      "ra-19",
      "Kitchen / bakery",
      "Food preparation & cold chain",
      "Microbiological or cross-contamination",
      "Foodborne illness, statutory closure",
      3,
      3,
      "Valid Certificate of Acceptability; food handler training; daily fridge/hot-hold temperature logs; dedicated hand-wash sink; pest control",
      1,
      3,
      "Food Safety PIC"
    ),
    makeRiskRow(
      "ra-20",
      "Cold room / freezer",
      "Entering walk-in cold rooms",
      "Door entrapment, cold stress",
      "Hypothermia, panic",
      2,
      4,
      "Internal safety release handle tested weekly; working door alarm & interior light; thermal jacket for extended stock checks",
      1,
      4,
      "Shift Supervisor"
    ),
    makeRiskRow(
      "ra-21",
      "All areas",
      "Building / retail fire",
      "Rapid fire and toxic smoke spread",
      "Burns, smoke inhalation, fatality",
      2,
      5,
      "Annual extinguisher servicing; clear illuminated escape routes; 6-monthly evacuation drills; trained shift Fire Marshals",
      1,
      5,
      "Emergency Coordinator"
    ),
    makeRiskRow(
      "ra-22",
      "All areas",
      "Hazardous cleaning & auto chemicals",
      "Chemical burns, toxic gas mixing (e.g. bleach + acid), ingestion",
      "Burns, respiratory injury, poisoning",
      3,
      3,
      "Hazardous Chemical Register & SDS file; original labelled containers only; never decant into beverage bottles; gloves & goggles",
      2,
      2,
      "Risk Assessor"
    ),
    makeRiskRow(
      "ra-23",
      "Car wash (if applicable)",
      "Pressure washers, detergents, wet bays",
      "Electric shock in wet area, chemical splash, slips",
      "Electrocution, eye/skin burns",
      3,
      4,
      "GFCI/earth-leakage protected circuits; daily hose/cable inspection; gumboots, waterproof apron, gloves & goggles",
      1,
      4,
      "Shift Supervisor"
    ),
    makeRiskRow(
      "ra-24",
      "Workshop (if applicable)",
      "Vehicle hoist / hydraulic jacks",
      "Vehicle falling from lift or jack",
      "Fatal crush injury",
      2,
      5,
      "Load-tested hoist per Driven Machinery Regs; trained operators only; rated axle stands; never work under unsupported loads (LSR 10)",
      1,
      5,
      "{{SECTION_16_2_MANAGER}}"
    ),
    makeRiskRow(
      "ra-25",
      "Generator (if applicable)",
      "Refuelling & operating standby generator",
      "Diesel spill on hot exhaust, CO exhaust build-up, noise",
      "Fire, carbon monoxide poisoning, hearing loss",
      2,
      4,
      "Refuel only when shut down and cooled; bunded containment; outdoor ventilation; DCP extinguisher staged; hearing protection",
      1,
      4,
      "Shift Supervisor"
    ),
    makeRiskRow(
      "ra-26",
      "Cashier / office",
      "Prolonged standing & POS/PC work",
      "Musculoskeletal strain & fatigue",
      "Lower-back / wrist disorders",
      3,
      2,
      "Biennial ergonomic assessment; anti-fatigue floor mats; adjustable seating; shift task rotation & rest intervals",
      2,
      2,
      "{{SECTION_16_2_MANAGER}}"
    ),
    makeRiskRow(
      "ra-27",
      "Forecourt",
      "Outdoor canopy operations",
      "Heat stress, cold rain, UV exposure",
      "Dehydration, heat exhaustion",
      3,
      2,
      "Canopy shelter; potable drinking water; weather-appropriate reflective outerwear; scheduled hydration breaks",
      2,
      2,
      "Shift Supervisor"
    ),
    makeRiskRow(
      "ra-28",
      "All areas",
      "Night shift fatigue & substance impairment",
      "Impaired judgement & slower emergency reaction",
      "Safety incidents, robbery vulnerability",
      3,
      4,
      "LSR 3 zero tolerance; alcohol screening; compliant shift rosters with 12 h rest; minimum two staff on night shift",
      1,
      4,
      "{{SECTION_16_2_MANAGER}}"
    ),
    makeRiskRow(
      "ra-29",
      "Environment",
      "Oil / water separator, drains & hazmat waste",
      "Hydrocarbon discharge into municipal stormwater or soil",
      "Environmental pollution, statutory fines",
      3,
      3,
      "Monthly separator inspection & licensed pump-out; safe disposal certificates retained; segregated lidded hazmat bins",
      1,
      3,
      "{{SECTION_16_2_MANAGER}}"
    ),
    makeRiskRow(
      "ra-30",
      "Contractors",
      "Canopy, signage, lighting & roof maintenance",
      "Fall from height, dropped tools on forecourt",
      "Fatality / public injury",
      3,
      5,
      "LSR 7 & 9: signed s37(2) agreement; Permit to Work; fall protection plan; barricaded drop zone; valid LoGS",
      1,
      5,
      "Contractor Coordinator"
    ),
    makeRiskRow(
      "ra-31",
      "Contractors",
      "Hot work (welding, grinding, cutting) near fuel zone",
      "Spark ignition of petroleum vapour",
      "Catastrophic explosion, fatality",
      2,
      5,
      "LSR 12: Hot-Work Permit; continuous LEL gas testing; dedicated fire watch with extinguishers; affected dispensers isolated",
      1,
      5,
      "Contractor Coordinator"
    ),
  ],
  hazardousChemicals: [
    {
      id: "chem-petrol",
      product: "Unleaded Petrol (PMS / ULP 93 & 95)",
      location: "Underground tanks & dispensers",
      hazards: "Extremely flammable liquid & vapour; contains benzene (carcinogen); aspiration hazard",
      ppe: "Nitrile gloves, anti-static uniform, safety shoes; avoid vapour inhalation; zero ignition",
    },
    {
      id: "chem-diesel",
      product: "Automotive Diesel (AGO / 50 ppm)",
      location: "Underground tanks, dispensers & generator",
      hazards: "Combustible liquid; skin irritant; aspiration hazard; toxic to aquatic organisms",
      ppe: "Nitrile gloves, safety shoes; prevent skin soak & drain release",
    },
    {
      id: "chem-lpg",
      product: "LPG (Propane / Butane Cylinders)",
      location: "Outdoor ventilated LPG cage",
      hazards: "Extremely flammable gas under pressure; explosion risk; cryogenic frostbite on leak",
      ppe: "Work gloves, safety shoes; open-air ventilation; zero ignition",
    },
    {
      id: "chem-lubes",
      product: "Engine Oils & Lubricants",
      location: "Convenience shop shelves & forecourt displays",
      hazards: "Mild skin/eye irritant; used oil hazardous environmental contaminant",
      ppe: "Nitrile gloves when handling bulk/used oil",
    },
    {
      id: "chem-coolant",
      product: "Coolant / Antifreeze (Ethylene Glycol)",
      location: "Convenience shop automotive aisle",
      hazards: "Harmful if swallowed; target organ toxicity",
      ppe: "Gloves; store strictly away from food and beverages",
    },
    {
      id: "chem-brake",
      product: "Brake & Hydraulic Fluid",
      location: "Convenience shop automotive aisle",
      hazards: "Serious eye irritant; harmful if ingested",
      ppe: "Gloves, safety glasses for decanting/spill cleanup",
    },
    {
      id: "chem-cleaners",
      product: "Cleaning Chemicals (Degreaser, Bleach, Sanitiser)",
      location: "Locked cleaning chemical store",
      hazards: "Corrosive/irritant; toxic chlorine gas if bleach mixed with acids",
      ppe: "Chemical gloves, splash goggles, apron",
    },
    {
      id: "chem-carwash",
      product: "Car Wash Detergents & Wax (if applicable)",
      location: "Car wash chemical bay",
      hazards: "Skin/eye irritant or corrosive concentrate",
      ppe: "Gumboots, chemical gloves, goggles, waterproof apron",
    },
    {
      id: "chem-cooking",
      product: "Hot Cooking Oil (if kitchen fitted)",
      location: "Kitchen / bakery fryer",
      hazards: "Severe thermal burns; Class F fat fire if overheated",
      ppe: "Heat-resistant gloves, heavy apron, non-slip shoes",
    },
  ],
  ptraChecks: [
    "Work area barricaded and forecourt traffic diverted",
    "Energy / electrical / dispenser lock-out & isolation completed (LSR 1)",
    "Task-specific PPE inspected and worn correctly (LSR 2)",
    "Fire extinguishers & spill kit staged within reach",
    "Emergency Stop (ESD) and site evacuation route confirmed",
    "Tools, ladders, and gas detectors inspected prior to start",
    "Signed Permit to Work displayed at the work point (LSR 9)",
  ],
  safeWorkProcedures: [
    {
      id: "sop-9-1",
      code: "SOP 9.1",
      title: "Fuel Dispensing",
      steps: [
        "Wear full reflective uniform and safety shoes. Greet the customer and confirm the vehicle engine is switched off.",
        "Verify zero smoking, open flames, or cell phone use at the island; politely pause/refuse service if non-compliant.",
        "Confirm exact fuel grade (PMS / AGO / IK) before zeroing the meter and dispensing. Never jam or leave a nozzle unattended.",
        "Portable containers: dispense only into approved, labelled fuel containers placed flat on the ground — never inside a vehicle or boot.",
        "Avoid overfilling; wipe minor drips immediately with absorbent cloth and place in the lidded hazardous waste bin.",
        "Tag out and report any leaking hose, nozzle, or dispenser to the supervisor immediately.",
      ],
    },
    {
      id: "sop-9-2",
      code: "SOP 9.2",
      title: "Bulk Fuel Delivery (Tanker Offloading)",
      steps: [
        "Only the appointed Fuel Delivery Controller may receive bulk tankers at {{SITE_NAME}} ({{SITE_CODE}}). Guide the tanker safely without standing behind it.",
        "Barricade the offloading exclusion zone and keep customers clear. Stage two 9 kg DCP extinguishers and a full spill kit at the fill point.",
        "Confirm tanker engine off, parking brake engaged, wheel chocks placed, and earth-bonding cable connected before opening hatches.",
        "Record pre-drop dipstick/ATG readings for receiving tank(s) and confirm sufficient ullage capacity.",
        "Cross-check waybill grade, compartment seal, and colour-coded fill point with the driver before signing or connecting hoses.",
        "Remain continuously at the fill point with the driver during offloading; shut valves immediately upon any leak or overfill alarm.",
        "After drop: drain hoses, secure caps, disconnect bonding last, take post-drop dip after settling, and reconcile delivery variance.",
        "Suspend or delay offloading during overhead lightning storms. Report discrepancies or spills immediately to {{SECTION_16_2_MANAGER}} and {{BRAND_NETWORK}}.",
      ],
    },
    {
      id: "sop-9-3",
      code: "SOP 9.3",
      title: "Fuel Spill Response",
      steps: [
        "Press the Emergency Shut-Off (ESD) immediately to isolate power to all {{DISPENSER_COUNT}} dispensers.",
        "Halt vehicle movement and eliminate every ignition source (no engines, phones, smoking, or non-Ex electrical switching).",
        "Small spill (< 25 L): don nitrile gloves and safety glasses, encircle with absorbent granules from the spill kit, sweep with non-sparking tools into labelled hazmat drums.",
        "Large spill (> 25 L) or spill threatening drains: evacuate forecourt upwind, block stormwater grates with hydrophobic booms, call fire/emergency services ({{EMERGENCY_CONTACT}}), and notify {{SECTION_16_2_MANAGER}}.",
        "NEVER wash or hose hydrocarbons into stormwater or municipal drains.",
        "Log the spill report in Section 11 and dispose of contaminated absorbent via a licensed hazardous waste contractor.",
        "Report significant environmental spills immediately to statutory environmental regulators in {{REGION_COUNTRY}}.",
      ],
    },
    {
      id: "sop-9-4",
      code: "SOP 9.4",
      title: "Fire Response",
      steps: [
        "Shout 'FIRE', sound the alarm, and trigger the forecourt Emergency Shut-Off (ESD).",
        "Only trained staff may attempt to extinguish a small incipient fire, from upwind with a clear escape route, using 9 kg DCP/CO2 (Class B/electrical) or fire blanket/Class F (kitchen). NEVER use water on fuel or oil fires.",
        "If the fire is not controlled within seconds, evacuate immediately to the upwind assembly point and call {{EMERGENCY_CONTACT}}.",
        "Emergency Coordinator completes staff/visitor headcount and briefs arriving fire officers. No re-entry until cleared.",
      ],
    },
    {
      id: "sop-9-5",
      code: "SOP 9.5",
      title: "LPG Cylinder Handling and Exchange",
      steps: [
        "Store all cylinders upright in the locked, ventilated outdoor cage; never store LPG indoors, in basements, or near drains.",
        "Do not exceed licensed cage storage limits and keep combustible packaging and ignition sources well clear.",
        "Inspect incoming cylinders for dents, rust, damaged collars, or leaking valves; reject defective cylinders immediately.",
        "Move 19 kg+ cylinders with a hand trolley and use two-person lift for 48 kg cylinders; never roll or drop.",
        "Perform leak checks using soapy water only — never a flame. If leaking: isolate ignition, evacuate area, and contact LPG supplier / {{EMERGENCY_CONTACT}}.",
      ],
    },
    {
      id: "sop-9-6",
      code: "SOP 9.6",
      title: "Electrical Safety and Lock-Out / Isolation",
      steps: [
        "Only registered, licensed electrical contractors may perform installation or panel work at {{SITE_NAME}}.",
        "Before maintenance on dispensers, submersible pumps, or machinery: isolate, lock and tag the breaker (LSR 1), test for zero energy, and keep the personal key.",
        "Immediately remove damaged cords, plugs, or appliances from use and attach 'DO NOT USE' tags.",
        "Keep electrical distribution boards closed, locked, labelled, and clear by 1 m; test earth-leakage trips monthly.",
        "Ensure only certified explosion-protected (Ex) tools and luminaires are used in hazardous dispenser, fill-point, and vent zones.",
      ],
    },
    {
      id: "sop-9-7",
      code: "SOP 9.7",
      title: "Manual Handling and Stacking",
      steps: [
        "Assess weight and grip before lifting; use a trolley or two-person team lift above 20–25 kg.",
        "Keep spine neutral, bend knees, hold loads close to torso, and avoid twisting while carrying.",
        "Stack heavy cartons on lower shelves within rated rack limits while keeping aisles, exits, and extinguishers clear.",
        "Use only monthly-inspected ladders with three points of contact; never stand on the top two rungs.",
      ],
    },
    {
      id: "sop-9-8",
      code: "SOP 9.8",
      title: "Armed Robbery and Cash Handling",
      steps: [
        "Prevention: limit till cash and attendant cash floats; perform regular drop-safe deposits; maintain bright lighting and CCTV.",
        "During an incident: stay calm, do not resist or argue, comply with instructions, keep hands visible, and activate the silent panic alarm only when safe.",
        "Note physical descriptions, clothing, vehicle make/registration, and escape direction without staring.",
        "After assailants depart: lock doors, contact Police & armed response ({{EMERGENCY_CONTACT}}), render first aid, and preserve the scene untouched.",
        "Record independent witness statements, notify {{SECTION_16_2_MANAGER}} and {{BRAND_NETWORK}}, and arrange trauma counselling for affected staff.",
      ],
    },
    {
      id: "sop-9-9",
      code: "SOP 9.9",
      title: "Customer Service and Conflict De-Escalation",
      steps: [
        "Maintain courteous, calm body language and avoid arguing with agitated customers.",
        "Step back to maintain safe space, call the Shift Supervisor, and use the panic button if threatened — never use physical force.",
        "Log abusive or threatening incidents in the site Incident Register before end of shift.",
      ],
    },
    {
      id: "sop-9-10",
      code: "SOP 9.10",
      title: "First Aid and Medical Emergencies",
      steps: [
        "Summon the duty First Aider immediately. Put on disposable nitrile gloves and stage a CPR mouthpiece before patient contact.",
        "Do not move a casualty with suspected neck/spinal trauma unless exposed to immediate fire or traffic danger; call EMS ({{EMERGENCY_CONTACT}}).",
        "For fuel or thermal burns, irrigate with cool running water for 20 minutes (never apply butter or oil) and cover with sterile non-fluffy dressing.",
        "Log every treatment in the First Aid Register and file statutory injury reports within 7 days.",
      ],
    },
    {
      id: "sop-9-11",
      code: "SOP 9.11",
      title: "Food Safety and Kitchen Hygiene (Where Applicable)",
      steps: [
        "Wash hands thoroughly before handling food, after breaks, after toilet use, and after handling cash or waste.",
        "Wear clean kitchen uniform, apron, and hair net; remove jewellery and report gastrointestinal illness prior to shift.",
        "Maintain hot-holding above 60 °C and refrigeration below 5 °C, recording checks daily.",
        "Never leave deep fryers unattended; allow oil to cool completely before draining or filtering.",
        "Switch off and unplug slicers and mixers before dismantling or cleaning.",
      ],
    },
    {
      id: "sop-9-12",
      code: "SOP 9.12",
      title: "Housekeeping and Waste Segregation",
      steps: [
        "Clean as you go across forecourt islands, shop aisles, and staff rooms; keep exits and fire equipment unobstructed.",
        "Segregate general, recyclable, and hazardous waste (fuel-soaked rags, spill absorbents, used oil filters) into clearly labelled lidded bins.",
        "Maintain clean, stocked customer and staff ablutions on the signed cleaning schedule.",
      ],
    },
    {
      id: "sop-9-13",
      code: "SOP 9.13",
      title: "Contractor Work and Permit to Work",
      steps: [
        "No contractor may start work at {{SITE_NAME}} without a signed s37(2) agreement, valid compensation LoGS, SHE file, induction, and LSR sign-off.",
        "Issue a written Permit to Work for hot work, working at height, confined spaces, electrical work, fuel system work, and excavations.",
        "Permit issuer and contractor jointly inspect hazards, verify isolations/gas tests, and sign the permit before work starts.",
        "Shift Supervisor monitors execution and stops non-compliant work; close out and inspect area upon completion.",
      ],
    },
  ],
  emergencyPlan: {
    intro:
      "Emergency response plan for {{SITE_NAME}} ({{SITE_CODE}}) covering fire, fuel spill, LPG leak, armed robbery, bomb threat, medical emergency, lightning, flooding, and dispenser vehicle impact across {{REGION_COUNTRY}}.",
    teamRoles: [
      { role: "Emergency Coordinator", shiftCoverage: "{{SECTION_16_2_MANAGER}} / Duty Shift Supervisor" },
      { role: "Fire Marshal — Forecourt", shiftCoverage: "Designated Forecourt Attendant per shift" },
      { role: "Fire Marshal — Shop / Kitchen", shiftCoverage: "Designated Cashier / Kitchen Lead per shift" },
      { role: "Duty First Aider (GSR 3)", shiftCoverage: "Certified First Aider per active shift" },
      { role: "Assembly Point Controller", shiftCoverage: "Shift Supervisor / Headcount Officer" },
    ],
    contacts: [
      { service: "Primary Site Emergency & EMS Dispatch ({{REGION_COUNTRY}})", numberOrRef: "{{EMERGENCY_CONTACT}}" },
      { service: "16(2) Assigned Site Manager ({{SITE_NAME}})", numberOrRef: "{{SECTION_16_2_MANAGER}}" },
      { service: "Network / Corporate SHE Desk ({{BRAND_NETWORK}})", numberOrRef: "Use {{BRAND_NETWORK}} 24/7 Incident Line ({{SITE_CODE}})" },
      { service: "Local Fire Brigade & Hazmat Services", numberOrRef: "{{EMERGENCY_CONTACT}} — verify municipal dispatch at shift handover" },
      { service: "Local Police / Armed Response Security", numberOrRef: "{{EMERGENCY_CONTACT}} — verify site armed-response radio/panic link" },
      { service: "Nearest Trauma Hospital / Poison Helpline", numberOrRef: "Insert nearest verified facility to {{PHYSICAL_ADDRESS}}" },
      { service: "Fuel Tanker & LPG Supplier Emergency Desk", numberOrRef: "Insert contracted bulk carrier & LPG supplier 24/7 contact" },
      { service: "Registered Electrical & Hazardous Waste Contractors", numberOrRef: "Insert contracted 24-hour call-out numbers" },
    ],
    evacuationProcedure: [
      "When an emergency alarm sounds or evacuation is ordered, stop work immediately and trigger the Emergency Shut-Off (ESD).",
      "Follow illuminated exit signs to the nearest safe exit; leave personal belongings behind.",
      "Assist customers, elderly patrons, and persons with disabilities to evacuate; Fire Marshals sweep restrooms, storerooms, and cold rooms.",
      "Proceed upwind to the designated Assembly Point clear of {{TANK_COUNT}} underground tank vents, fill points, and the LPG cage.",
      "Assembly Point Controller conducts full headcount against the active shift roster and visitor/contractor log.",
      "Emergency Coordinator briefs arriving emergency responders ({{EMERGENCY_CONTACT}}); nobody re-enters until official 'all clear'.",
    ],
    specificEmergencies: [
      {
        emergency: "Fire",
        immediateActions: "Hit ESD, shout FIRE, fight small fire only if trained/safe with DCP/CO2/Class F, otherwise evacuate and call {{EMERGENCY_CONTACT}} (SOP 9.4).",
      },
      {
        emergency: "Fuel spill",
        immediateActions: "Hit ESD, remove all ignition sources, cordon spill, block drains with booms, recover with absorbent, report large spills (SOP 9.3).",
      },
      {
        emergency: "LPG gas leak",
        immediateActions: "Zero ignition or electrical switching, isolate valve if safe, evacuate upwind, call LPG supplier & fire brigade ({{EMERGENCY_CONTACT}}).",
      },
      {
        emergency: "Armed robbery",
        immediateActions: "Comply calmly, zero resistance, trigger panic button only when safe, call Police ({{EMERGENCY_CONTACT}}), preserve crime scene (SOP 9.8).",
      },
      {
        emergency: "Bomb threat",
        immediateActions: "Keep caller talking to note details, avoid two-way radios near suspect area, evacuate site cleanly, call Police ({{EMERGENCY_CONTACT}}).",
      },
      {
        emergency: "Medical emergency",
        immediateActions: "Call duty First Aider, wear nitrile gloves, call ambulance ({{EMERGENCY_CONTACT}}), do not move spinal trauma casualty (SOP 9.10).",
      },
      {
        emergency: "Lightning storm",
        immediateActions: "Halt tanker offloading immediately; suspend outdoor dispensing if lightning is directly overhead; shelter indoors.",
      },
      {
        emergency: "Flooding",
        immediateActions: "Isolate dispensers if water enters sumps or tank manholes; check water paste / ATG water (mm) and report to {{SECTION_16_2_MANAGER}}.",
      },
      {
        emergency: "Vehicle impact into dispenser",
        immediateActions: "Hit ESD immediately, keep public clear of vapour/leak, treat injured, call {{EMERGENCY_CONTACT}}, report to {{BRAND_NETWORK}}.",
      },
    ],
    debriefFields: [
      "Date / Time Initiated & Completed",
      "Type (Scheduled Drill vs Actual Emergency)",
      "Area Evacuated & Assembly Point Used",
      "Total Headcount Verified & All Accounted For (Y/N)",
      "Emergency Shut-Off (ESD) Activated (Y/N)",
      "Equipment Deployed (Alarms, Extinguishers, Spill Kit)",
      "Problems Observed & Corrective Actions (Owner / Due Date)",
    ],
  },
  incidentManagement: {
    reportingRules: [
      {
        what: "Every injury, near miss, spill, robbery, wetstock lock, or Life Saving Rule breach",
        reportTo: "Shift Supervisor & {{SECTION_16_2_MANAGER}}",
        timeframe: "Immediately; logged before shift close",
        reference: "{{BRAND_NETWORK}} SHE Specification",
      },
      {
        what: "High-severity incidents & Life Saving Rule violations",
        reportTo: "{{BRAND_NETWORK}} Regional SHE & Area Manager",
        timeframe: "Before end of shift",
        reference: "{{BRAND_NETWORK}} Incident Protocol",
      },
      {
        what: "Fatality, unconsciousness, amputation, or major dangerous occurrence",
        reportTo: "National Labour / OHS Inspectorate ({{REGION_COUNTRY}})",
        timeframe: "Immediately by phone; written notice within 7 days (preserve scene)",
        reference: "OHS Act s24; GAR Reg 8",
      },
      {
        what: "Work-related injury requiring medical care / lost time",
        reportTo: "Workers' Compensation Fund (W.Cl.2 / Statutory Claim)",
        timeframe: "Within 7 days of notice",
        reference: "COIDA s38–39 / National Equivalent",
      },
      {
        what: "Occupational disease diagnosis",
        reportTo: "Workers' Compensation Fund (W.Cl.14)",
        timeframe: "Within 14 days of diagnosis",
        reference: "COIDA s68",
      },
      {
        what: "Major fuel spill / environmental contamination",
        reportTo: "Emergency Services ({{EMERGENCY_CONTACT}}), Environmental Authority & {{BRAND_NETWORK}}",
        timeframe: "Immediately",
        reference: "NEMA s30 / National EPA",
      },
      {
        what: "All site incidents & near misses",
        reportTo: "Site Incident Register (Annexure 1 Format)",
        timeframe: "Recorded & retained minimum 3 years",
        reference: "GAR Reg 9",
      },
    ],
    investigationProtocol: [
      "Investigate every incident and near miss jointly with the Incident Investigator and H&S Representative using 5-Whys root-cause analysis.",
      "Record root causes, failed barriers, and time-bound corrective actions in the Corrective Action Register (Section 20).",
      "Brief learnings to all {{SITE_NAME}} shifts during toolbox talks and verify corrective action effectiveness.",
      "Cooperate with {{BRAND_NETWORK}} and statutory inspectors; retain signed reports for audit.",
    ],
    registerColumns: [
      "Ref No.",
      "Date / Time",
      "Person(s) Involved",
      "Category (Injury / Near Miss / Spill / Fire / Robbery / LSR)",
      "Description",
      "Reported to {{BRAND_NETWORK}} (Time)",
      "Investigation Close-Out",
    ],
  },
  inspectionChecklists: {
    daily: {
      id: "daily",
      title: "Daily Shift Inspection Checklist — {{SITE_NAME}}",
      frequency: "Daily (Start of Each Shift)",
      responsible: "Shift Supervisor",
      items: [
        { id: "d1", category: "Forecourt", text: "Forecourt clean; no fuel leaks at dispensers, hoses, breakaways, or nozzles" },
        { id: "d2", category: "Emergency", text: "Emergency Stop (ESD) buttons visible, unobstructed, and clearly labelled" },
        { id: "d3", category: "Fire", text: "Fire extinguishers in place at each island, tamper-sealed, gauge in green, accessible" },
        { id: "d4", category: "Environment", text: "Spill kits at dispenser islands and fill points stocked and sealed" },
        { id: "d5", category: "Signage", text: "No-smoking, no-cell-phone, and switch-off-engine signs legible at all islands" },
        { id: "d6", category: "UST Integrity", text: "Tank fill point caps and manhole covers closed, secure, and free of standing fuel/water" },
        { id: "d7", category: "LPG", text: "LPG cage locked, cylinders upright, zero gas odour or damaged seals" },
        { id: "d8", category: "Security", text: "Panic buttons and CCTV operational; cash drop-safe active and till limits enforced" },
        { id: "d9", category: "Lighting", text: "Canopy, shop, and perimeter floodlighting operational" },
        { id: "d10", category: "Shop", text: "Shop floors dry and clear; wet-floor warning cones staged" },
        { id: "d11", category: "Egress", text: "Escape routes and emergency exits unlocked during trading hours and unobstructed" },
        { id: "d12", category: "Food Safety", text: "Kitchen clean; fryer controls normal; fridge and freezer temperatures logged" },
        { id: "d13", category: "PPE & Fitness", text: "Staff wearing correct reflective PPE & safety shoes; fit for duty (alcohol screening done)" },
        { id: "d14", category: "Hygiene", text: "Customer and staff ablutions clean and stocked (soap, running water, paper)" },
        { id: "d15", category: "Drainage", text: "Stormwater grates and oil/water separator inlet free of litter or fuel sheen" },
        { id: "d16", category: "Briefing", text: "Pre-shift safety briefing and wetstock handover completed" },
      ],
    },
    weekly: {
      id: "weekly",
      title: "Weekly Statutory Inspection Checklist — {{SITE_NAME}}",
      frequency: "Weekly",
      responsible: "Shift Supervisor / {{SECTION_16_2_MANAGER}}",
      items: [
        { id: "w1", category: "First Aid", text: "First aid box contents audited against GSR 3 minimum list and restocked" },
        { id: "w2", category: "PPE", text: "Spare PPE stock levels verified (gloves, vests, goggles, safety shoes)" },
        { id: "w3", category: "Emergency", text: "Emergency Stop (ESD) buttons function-tested per site safety procedure" },
        { id: "w4", category: "Fire", text: "All fire extinguisher pressure gauges, hoses, and brackets inspected" },
        { id: "w5", category: "Fuel Receiving", text: "Tanker earth-bonding cable, clamp, and continuity checked in good order" },
        { id: "w6", category: "Electrical", text: "Portable electrical cords, plugs, and extension leads visually inspected" },
        { id: "w7", category: "Cold Chain", text: "Storeroom housekeeping clear; walk-in cold room internal safety release handle tested" },
        { id: "w8", category: "Storage", text: "Stock stacked safely within rack load limits; aisles clear" },
        { id: "w9", category: "Waste", text: "Hazardous waste bins lidded, labelled, and under fill threshold" },
        { id: "w10", category: "Incidents", text: "Incident and near-miss register reviewed; open actions followed up" },
        { id: "w11", category: "Training", text: "Weekly toolbox talk delivered and attendance register signed" },
        { id: "w12", category: "Kitchen", text: "Kitchen hygiene audit completed and extraction canopy grease filters cleaned" },
        { id: "w13", category: "Sanitation", text: "Hand-wash stations, eyewash bottles, and hygiene signage verified" },
        { id: "w14", category: "Wetstock", text: "Weekly tank dip / ATG wetstock reconciliation reviewed for cumulative variance trends" },
      ],
    },
    monthly: {
      id: "monthly",
      title: "Monthly Management OHS Inspection — {{SITE_NAME}}",
      frequency: "Monthly",
      responsible: "{{SECTION_16_2_MANAGER}} / H&S Representative",
      items: [
        { id: "m1", category: "Fire", text: "Fire equipment register updated; annual service dates verified valid" },
        { id: "m2", category: "Electrical", text: "Earth-leakage protection units push-tested and logged in register" },
        { id: "m3", category: "Ladders", text: "All site ladders inspected and recorded (GSR 13A)" },
        { id: "m4", category: "Electrical", text: "Portable electrical appliance register updated and tagged" },
        { id: "m5", category: "Signage", text: "Full safety signage audit completed (SANS 1186 register)" },
        { id: "m6", category: "Emergency", text: "Evacuation maps posted and {{EMERGENCY_CONTACT}} numbers verified" },
        { id: "m7", category: "Environment", text: "Oil/water separator inspected for oil/sludge depth; pump-out scheduled if needed" },
        { id: "m8", category: "Waste", text: "Hazardous waste register and safe disposal certificates reconciled" },
        { id: "m9", category: "LPG", text: "LPG cage structure, padlocks, safety distances, and signage verified" },
        { id: "m10", category: "Compliance", text: "Legal appointment letters valid and competence certificates current" },
        { id: "m11", category: "Training", text: "Training matrix reviewed and upcoming refresher training scheduled" },
        { id: "m12", category: "H&S Rep", text: "H&S Representative monthly workplace inspection report filed" },
        { id: "m13", category: "Contractors", text: "Contractor register, s37(2) agreements, and Permits to Work closed out" },
        { id: "m14", category: "Assurance", text: "Corrective action register reviewed for overdue close-outs" },
        { id: "m15", category: "Licences", text: "Statutory Certificates Register checked for expiries within 60 days" },
        { id: "m16", category: "Network", text: "{{BRAND_NETWORK}} safety alerts and bulletins briefed to all shifts" },
        { id: "m17", category: "Feedback", text: "Safety-related customer feedback logged and resolved" },
      ],
    },
  },
  equipmentRegisters: {
    firstAidMinimumContents: [
      { item: "Wound cleaner / antiseptic (100 ml)", minQty: "1" },
      { item: "Swabs for cleaning wounds", minQty: "1 pack" },
      { item: "Cotton wool for padding (100 g)", minQty: "1" },
      { item: "Sterile gauze swabs", minQty: "10" },
      { item: "Pair of splinter forceps", minQty: "1" },
      { item: "Pair of scissors (min. 100 mm)", minQty: "1" },
      { item: "Set of safety pins", minQty: "1" },
      { item: "Straight splints", minQty: "2" },
      { item: "Disposable nitrile / latex gloves (large & medium)", minQty: "2 pairs each" },
      { item: "Triangular bandages", minQty: "4" },
      { item: "Roller bandages (75 mm)", minQty: "4" },
      { item: "Roller bandages (100 mm)", minQty: "4" },
      { item: "Elastic adhesive roll (25 mm)", minQty: "1" },
      { item: "Non-allergenic adhesive strip (25 mm x 3 m)", minQty: "1" },
      { item: "Adhesive dressing strips (assorted)", minQty: "10" },
      { item: "First aid dressings (75 x 100 mm)", minQty: "4" },
      { item: "First aid dressings (150 x 200 mm)", minQty: "4" },
      { item: "CPR pocket mouthpiece / resuscitation barrier", minQty: "2" },
    ],
    safetySignageRegister: [
      { sign: "No smoking / no naked flames", requiredLocation: "Every dispenser island, tank fill point, LPG cage, entrances" },
      { sign: "Switch off cell phones", requiredLocation: "Every dispenser island" },
      { sign: "Switch off engine before refuelling", requiredLocation: "Every dispenser island" },
      { sign: "Emergency Stop (ESD)", requiredLocation: "Clearly marked above every ESD actuator" },
      { sign: "Fire Extinguisher location", requiredLocation: "Above every extinguisher bracket" },
      { sign: "First Aid Box", requiredLocation: "Office / kiosk first aid station" },
      { sign: "Emergency Exit / Escape Route", requiredLocation: "All exit doors & corridors (illuminated)" },
      { sign: "Assembly Point", requiredLocation: "Upwind perimeter assembly point" },
      { sign: "Flammable Gas / LPG — No Smoking", requiredLocation: "LPG cylinder storage cage" },
      { sign: "Wet Floor (portable A-frame)", requiredLocation: "Convenience shop & ablution entrances" },
      { sign: "Authorised Persons Only", requiredLocation: "Office, storeroom, electrical room, DBs" },
      { sign: "Danger — Electrical Hazard", requiredLocation: "All distribution boards and switch rooms" },
      { sign: "PPE Required", requiredLocation: "Kitchen, fuel fill point, car wash" },
      { sign: "Speed Limit / Pedestrian Crossing", requiredLocation: "Forecourt entry/exit and walkways" },
      { sign: "Emergency Numbers ({{EMERGENCY_CONTACT}})", requiredLocation: "Cashier till, manager office, forecourt kiosk" },
      { sign: "OHS Summary & 12 Life Saving Rules Poster", requiredLocation: "Staff notice board / break area" },
    ],
    registerSchemas: [
      {
        id: "reg-fire",
        title: "Fire Equipment Register (SANS 1475-1)",
        subtitle: "Annual accredited servicing + monthly Fire Marshal visual checks.",
        columns: ["Unit No.", "Location", "Type (DCP / CO2 / Class F / Blanket)", "Size", "Service Due", "Jan–Jun", "Jul–Dec"],
      },
      {
        id: "reg-firstaid",
        title: "First Aid Weekly Check & Treatment Register",
        subtitle: "Verify GSR 3 kit weekly and record every treatment rendered.",
        columns: ["Date / Time", "Location / Casualty", "Status / Injury", "Action / Treatment", "Referred (Y/N)", "First Aider"],
      },
      {
        id: "reg-ppe",
        title: "PPE Issue Register (GSR 2)",
        subtitle: "Free PPE issue and replacement sign-off for {{SITE_NAME}} staff.",
        columns: ["Date", "Employee Name", "PPE Item", "Qty", "Size", "Reason (New / Replace)", "Signature"],
      },
      {
        id: "reg-ladder",
        title: "Ladder Inspection Register (GSR 13A)",
        subtitle: "Monthly structural & rung inspection; tag out any damaged ladder.",
        columns: ["Ladder No.", "Type / Length", "Location", "Monthly Date & Result", "Defects", "Inspected By"],
      },
      {
        id: "reg-electrical",
        title: "Portable Electrical & Earth Leakage Test Register",
        subtitle: "Monthly earth-leakage push-button test and cord/casing audit.",
        columns: ["Asset / DB No.", "Location", "Plug & Cord OK", "Casing OK", "Test Date", "Trip Result", "Inspector"],
      },
      {
        id: "reg-alcohol",
        title: "Alcohol & Drug Screening Register (LSR 3)",
        subtitle: "Confidential screening log for shift start, random, or post-incident checks.",
        columns: ["Date / Time", "Name", "Reason (Shift / Random / Incident)", "Result", "Action Taken", "Tester", "Signature"],
      },
      {
        id: "reg-waste",
        title: "Hazardous Waste & Oil/Water Separator Register",
        subtitle: "Track separator inspections and licensed hazmat disposal certificates.",
        columns: ["Date", "Waste / Separator Check", "Quantity / Sludge Level", "Hazmat (Y/N)", "Licensed Contractor", "Disposal Cert No.", "Inspector"],
      },
    ],
  },
  statutoryCertificates: [
    "Petroleum Products Act — Site Licence ({{REGION_COUNTRY}})",
    "Petroleum Products Act — Retail Licence ({{SITE_CODE}})",
    "Electrical Installation Certificate of Compliance (COC)",
    "LPG Installation COC / Approved Retail Storage Permit",
    "Local Fire Authority Flammable Substance Certificate",
    "Fire Extinguisher Annual Service Certificate (Accredited Tech)",
    "Certificate of Acceptability for Food Premises (if applicable)",
    "Municipal Business / Trading Licence",
    "Workers' Compensation / COIDA Letter of Good Standing",
    "Air Compressor / Pressure Vessel Inspection Certificate",
    "Vehicle Hoist Inspection & Load-Test Certificate (if applicable)",
    "Underground Tank & Line Integrity / Tightness Test ({{TANK_COUNT}} Tanks)",
    "Dispenser Pump Meter Calibration Certificate ({{DISPENSER_COUNT}} Dispensers)",
    "Pest Control Service Certificate",
    "Oil / Water Separator Service & Safe Disposal Certificate",
    "Lightning Protection Inspection Certificate (if fitted)",
    "{{BRAND_NETWORK}} Network SHE Audit Report",
  ],
  trainingAndInduction: {
    roles: ["16(2) Manager", "Supervisor", "Attendant", "Cashier", "Food Handler", "Cleaner"],
    trainingMatrix: [
      { course: "Site SHE Induction & 12 Life Saving Rules", requirementsByRole: ["R", "R", "R", "R", "R", "R"], frequency: "On start; annual refresher" },
      { course: "OHS Legal Liability / Section 16(2) Training", requirementsByRole: ["R", "O", "", "", "", ""], frequency: "Once; refresh 3 years" },
      { course: "Supervisor SHE Leadership", requirementsByRole: ["R", "R", "", "", "", ""], frequency: "Once; refresh 3 years" },
      { course: "Health & Safety Representative", requirementsByRole: ["A", "A", "A", "A", "A", "A"], frequency: "On appointment" },
      { course: "First Aid Level 1 (Accredited)", requirementsByRole: ["A", "A", "A", "A", "A", "A"], frequency: "Every 3 years" },
      { course: "Basic Fire Fighting & P.A.S.S. Drill", requirementsByRole: ["R", "R", "R", "R", "O", "O"], frequency: "Every 2 years" },
      { course: "Fuel Dispensing, Spill Response & ESD", requirementsByRole: ["R", "R", "R", "", "", ""], frequency: "Annually" },
      { course: "Bulk Fuel Receiving & Dipstick / ATG Wetstock", requirementsByRole: ["R", "A", "A", "", "", ""], frequency: "Annually" },
      { course: "LPG Cylinder Safe Handling", requirementsByRole: ["R", "R", "R", "R", "", ""], frequency: "Annually" },
      { course: "Incident Investigation (5-Whys Root Cause)", requirementsByRole: ["R", "A", "", "", "", ""], frequency: "Once; refresh 3 years" },
      { course: "HIRA Risk Assessment & PTRA", requirementsByRole: ["R", "A", "", "", "", ""], frequency: "Once; refresh 3 years" },
      { course: "Armed Robbery Awareness & Trauma Response", requirementsByRole: ["R", "R", "R", "R", "R", "R"], frequency: "Annually" },
      { course: "Hazardous Chemicals & SDS Awareness", requirementsByRole: ["R", "R", "R", "R", "R", "R"], frequency: "Annually" },
      { course: "Manual Handling & Ladder Safety", requirementsByRole: ["O", "R", "R", "R", "R", "R"], frequency: "Annually" },
      { course: "Food Safety & Hygiene (where applicable)", requirementsByRole: ["R", "O", "", "", "R", ""], frequency: "Annually" },
      { course: "Emergency Evacuation Drill Participation", requirementsByRole: ["R", "R", "R", "R", "R", "R"], frequency: "Every 6 months" },
    ],
    inductionChecklist: [
      "OHS policy and alcohol/drug zero-tolerance policy explained",
      "12 {{BRAND_NETWORK}} Life Saving Rules explained and acknowledgement signed",
      "Site layout, hazardous zoned areas, and restricted rooms walked through",
      "Emergency Shut-Off (ESD), alarm, escape routes, and assembly point demonstrated",
      "Fire extinguisher locations, types (DCP/CO2/Class F), and P.A.S.S. operation",
      "Spill kits, hydrophobic drain booms, and fuel spill response SOP 9.3",
      "First aid box location and shift First Aiders identified",
      "Incident and near-miss reporting (before shift end) without victimisation",
      "Mandatory PPE requirements and free issue logged",
      "Armed robbery do-not-resist procedure and silent panic button locations",
      "Task-specific SOPs and wetstock dipstick/ATG rules briefed",
      "Right to refuse unsafe work and H&S Representative contact",
      "Hygiene, ablutions, and housekeeping waste segregation",
      "Hazardous Chemical Register and Safety Data Sheet (SDS) folder location",
    ],
    toolboxTalkSchedule: [
      { monthLabel: "Month 01", topic1: "12 Life Saving Rules overview", topic2: "Fuel spill response and Emergency Stop (ESD)" },
      { monthLabel: "Month 02", topic1: "Armed robbery awareness & cash drop discipline", topic2: "Shift fatigue and forecourt traffic safety" },
      { monthLabel: "Month 03", topic1: "Fire extinguisher P.A.S.S. drill", topic2: "Housekeeping and slip/trip prevention" },
      { monthLabel: "Month 04", topic1: "Bulk fuel delivery safety & ullage checks", topic2: "Hazardous chemicals and SDS awareness" },
      { monthLabel: "Month 05", topic1: "LPG cylinder handling & leak testing", topic2: "Safe manual lifting & trolley use" },
      { monthLabel: "Month 06", topic1: "Alcohol & drugs zero tolerance (LSR 3)", topic2: "First aid basics & injury reporting" },
      { monthLabel: "Month 07", topic1: "Electrical safety & lock-out/tag-out (LSR 1)", topic2: "Site evacuation drill walkthrough" },
      { monthLabel: "Month 08", topic1: "Wet/cold weather forecourt controls", topic2: "Ladders & working at heights (LSR 7)" },
      { monthLabel: "Month 09", topic1: "Food safety & temperature logs", topic2: "Customer conflict de-escalation" },
      { monthLabel: "Month 10", topic1: "Contractor Permits to Work (LSR 9)", topic2: "Near-miss & hazard reporting" },
      { monthLabel: "Month 11", topic1: "Ignition sources, bonding & static (LSR 12)", topic2: "Oil/water separator & hazmat waste care" },
      { monthLabel: "Month 12", topic1: "Heat stress & hydration controls", topic2: "Annual review of incidents & lessons learned" },
    ],
    certificateTemplate: {
      heading: "CERTIFICATE OF FORECOURT SAFETY & OHS AWARENESS",
      subheading: "{{BRAND_NETWORK}} · Site {{SITE_CODE}} · {{REGION_COUNTRY}}",
      statement:
        "This certifies that the named forecourt team member at {{SITE_NAME}} ({{PHYSICAL_ADDRESS}}) has completed practical awareness and emergency readiness training covering wetstock compliance ({{TANK_COUNT}} tanks / {{DISPENSER_COUNT}} dispensers), P.A.S.S. fire response, fuel spill containment, first aid basics, and the 12 Life Saving Rules.",
      regulatoryBasis:
        "Aligned to {{REGION_COUNTRY}} statutory OHS & petroleum retail standards and SANS 10089-3.",
      authorizedByLabel: "Authorised by 16(2) Assigned Manager: {{SECTION_16_2_MANAGER}}",
      footerNote:
        "Site Code: {{SITE_CODE}} · Emergency Dispatch: {{EMERGENCY_CONTACT}} · Keep signed copy in Section 14 Training File.",
    },
  },
  governance: {
    committeeAgenda: [
      "Opening, attendance, and apologies",
      "Approval of previous H&S Committee minutes",
      "Matters arising and overdue corrective actions",
      "Incidents, near misses, and 5-Whys investigation findings",
      "Daily/weekly/monthly inspection and wetstock trigger audit findings",
      "{{BRAND_NETWORK}} safety learnings and bulletins",
      "12 Life Saving Rules field observations",
      "Training matrix completion and scheduled refreshers",
      "PPE and emergency equipment replacement needs",
      "Contractor Permits to Work and site activities",
      "Legal register and statutory certificate expiries",
      "General business and date of next meeting",
    ],
    contractorMinimumRequirements: [
      "Signed Section 37(2) Mandatary Agreement prior to starting work",
      "Valid Workers' Compensation / COIDA Letter of Good Standing",
      "Contractor SHE File (policy, appointments, risk assessment, method statement, PPE, emergency plan)",
      "{{BRAND_NETWORK}}-approved vendor clearance for underground tank, fuel line, or dispenser work",
      "Proof of technical competence (registered electrician, fall arrest, gas testing)",
      "Medical fitness certificates where task risk assessment requires",
      "Site SHE induction and 12 Life Saving Rules sign-off at {{SITE_NAME}}",
      "Authorised Permit to Work issued and displayed at work location",
      "Pre-inspected tools, ladders, lifting gear, and calibrated gas meters",
      "Equivalent compliance verified for any approved sub-contractors",
    ],
    section372Clauses: [
      "The Mandatary is an employer in its own right and undertakes to comply with all applicable OHS statutes and regulations in {{REGION_COUNTRY}}.",
      "The Mandatary will strictly adhere to the {{SITE_NAME}} SHE policy, Permit-to-Work controls, and the 12 {{BRAND_NETWORK}} Life Saving Rules.",
      "The Mandatary supplies competent supervision, statutory appointments, task risk assessments, compliant PPE, and inspected equipment.",
      "All incidents and near misses must be reported to {{SECTION_16_2_MANAGER}} before shift end and notified to statutory authorities where required.",
      "{{SITE_NAME}} management reserves the right to halt work immediately and remove non-compliant contractor personnel.",
      "Pursuant to Section 37(2), the Employer is relieved of liability for unlawful acts or omissions of the Mandatary unless expressly permitted.",
    ],
    permitWorkTypes: [
      "Hot work (welding, grinding, cutting)",
      "Working at heights (> 2 m)",
      "Confined space entry (tanks / sumps)",
      "Electrical isolation & panel work",
      "Fuel system / dispenser line breaking",
      "Excavation & trenching",
      "Heavy lifting / crane operations",
    ],
    permitPrecautions: [
      "Work area barricaded from vehicles and customers",
      "Pumps / dispensers / breakers locked & tagged out (LSR 1)",
      "DCP / CO2 extinguishers & spill kit staged",
      "Continuous LEL / O2 gas testing & fire watch assigned",
      "Fall protection harness & anchor inspected (LSR 7)",
      "Confined space rescue plan & tripod staged (LSR 11)",
      "Pre-Task Risk Assessment (PTRA) signed by crew",
      "Customers routed safely clear of exclusion zone",
    ],
    environmentalManagementPlan: [
      {
        aspect: "Underground fuel storage & dispensing",
        impact: "Soil and groundwater contamination",
        control: "Daily wetstock reconciliation across {{TANK_COUNT}} tanks; leak triggers; tank tightness tests; immediate escalation of losses",
      },
      {
        aspect: "Surface fuel spills",
        impact: "Soil and stormwater pollution",
        control: "Spill kits & hydrophobic drain booms at islands/fill points; SOP 9.3; statutory spill notification",
      },
      {
        aspect: "Oil / water separator",
        impact: "Oily effluent discharge to sewer/stormwater",
        control: "Monthly visual inspection; periodic pump-out by licensed contractor; disposal certificates retained",
      },
      {
        aspect: "Hazardous waste (oily rags, absorbents, used oil)",
        impact: "Toxic soil/water contamination",
        control: "Dedicated lidded hazmat drums; registered hazmat carrier; safe disposal certificates in Section 18",
      },
      {
        aspect: "General & shop waste",
        impact: "Litter, pests, odour",
        control: "Daily waste removal; recyclables separated; active pest-control schedule",
      },
      {
        aspect: "Hydrocarbon vapour emissions",
        impact: "Air quality & worker benzene exposure",
        control: "Tight fill caps & dip plugs; vapour recovery maintained where installed",
      },
      {
        aspect: "Water & electricity consumption",
        impact: "Resource depletion",
        control: "Prompt plumbing leak repair; LED canopy controls; monitor utility usage",
      },
    ],
    auditSchedule: [
      { activity: "Daily / weekly / monthly checklists", byWhom: "Supervisor / {{SECTION_16_2_MANAGER}}", frequency: "Per Section 12 schedule" },
      { activity: "H&S Representative workplace inspection", byWhom: "Designated H&S Representative", frequency: "Monthly" },
      { activity: "Planned task observation & LSR verification", byWhom: "{{SECTION_16_2_MANAGER}} / Supervisor", frequency: "Monthly" },
      { activity: "Internal OHS Master File audit", byWhom: "16(1) Employer / {{SECTION_16_2_MANAGER}}", frequency: "Quarterly" },
      { activity: "{{BRAND_NETWORK}} network SHE audit", byWhom: "{{BRAND_NETWORK}} Auditor", frequency: "As scheduled" },
      { activity: "External statutory legal compliance audit", byWhom: "Independent OHS Practitioner", frequency: "Annually (recommended)" },
      { activity: "Statutory authority inspection", byWhom: "Labour / Fire / Energy Regulators ({{REGION_COUNTRY}})", frequency: "Unannounced / periodic" },
    ],
  },
};

export function renderOhsText(template: string, ctx: SiteTemplateContext): string {
  const safeName = ctx.siteName.trim() || "Service Station Site";
  const safeBrand = ctx.brandNetwork.trim() || "Independent Retail Forecourt";
  const safeCode = ctx.siteCode.trim() || "SITE-01";
  const safeAddr = ctx.physicalAddress.trim() || "Site Physical Address";
  const safeRegion = ctx.regionCountry.trim() || "Regional Jurisdiction";
  const safeMgr = ctx.section162Manager.trim() || "16(2) Assigned Manager";
  const safeEmg = ctx.emergencyContact.trim() || "Local Emergency Dispatch";
  const safeTanks = String(Math.max(1, ctx.tankCount || 1));
  const safeDispensers = String(Math.max(1, ctx.dispenserCount || 1));

  return template
    .replaceAll("{{SITE_NAME}}", safeName)
    .replaceAll("{{BRAND_NETWORK}}", safeBrand)
    .replaceAll("{{SITE_CODE}}", safeCode)
    .replaceAll("{{PHYSICAL_ADDRESS}}", safeAddr)
    .replaceAll("{{REGION_COUNTRY}}", safeRegion)
    .replaceAll("{{SECTION_16_2_MANAGER}}", safeMgr)
    .replaceAll("{{EMERGENCY_CONTACT}}", safeEmg)
    .replaceAll("{{TANK_COUNT}}", safeTanks)
    .replaceAll("{{DISPENSER_COUNT}}", safeDispensers);
}

function hydrateNode<T>(node: T, ctx: SiteTemplateContext): T {
  if (typeof node === "string") {
    return renderOhsText(node, ctx) as unknown as T;
  }
  if (Array.isArray(node)) {
    return node.map((item) => hydrateNode(item, ctx)) as unknown as T;
  }
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] = hydrateNode(v, ctx);
    }
    return out as T;
  }
  return node;
}

export function resolveOhsMasterTemplate(ctx: SiteTemplateContext): OhsMasterTemplate {
  return hydrateNode(GENERIC_OHS_MASTER_TEMPLATE, ctx);
}

