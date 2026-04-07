import { TenderCategory } from "@prisma/client";

// ─── keyword → category mapping (ordered by specificity) ─────────────────────
// Each entry is scored: most matched keywords wins. Ties resolved by order here.
const KEYWORD_MAP: Array<{ category: TenderCategory; keywords: string[] }> = [
  {
    category: "CONSTRUCTION",
    keywords: [
      "road", "highway", "bridge", "flyover", "overbridge", "underpass",
      "rob", "rub", "tunnel", "metro", "construction", "civil", "pavement",
      "bituminous", "dam", "canal", "bund", "embankment", "retaining wall",
      "building", "structure", "renovation", "rehabilitation", "repair",
      "pwdm", "nhai", "cpwd", "infrastructure",
    ],
  },
  {
    category: "IT_SERVICES",
    keywords: [
      "server", "desktop", "laptop", "computer", "software", "application",
      "network", "networking", "switch", "router", "firewall", "storage",
      "san", "nas", "cloud", "data centre", "data center", "datacenter",
      "erp", "crm", "portal", "website", "digital", "ict", "hardware",
      "printer", "scanner", "biometric", "cctv", "surveillance", "it",
    ],
  },
  {
    category: "MEDICAL",
    keywords: [
      "medicine", "medical", "drug", "pharmaceutical", "hospital",
      "ventilator", "x-ray", "ultrasound", "mri", "ct scan", "ecg",
      "surgical", "reagent", "consumable", "ppe", "diagnostic",
      "icu", "patient", "health", "clinical", "pathology",
    ],
  },
  {
    category: "ELECTRICAL",
    keywords: [
      "electrical", "electricity", "substation", "transformer",
      "generator", "dg set", "dg sets", "ups", "invertors", "inverter",
      "wiring", "switchgear", "led", "lighting", "streetlight",
      "panel", "cable", "scada", "solar", "renewable", "energy meter",
      "lt line", "ht line", "ohe",
    ],
  },
  {
    category: "TRANSPORTATION",
    keywords: [
      "bus", "electric bus", "vehicle", "fleet", "truck", "lorry",
      "ambulance", "train", "locomotive", "coach", "aircraft",
      "ship", "ferry", "transport", "taxi", "cab",
    ],
  },
  {
    category: "PLUMBING",
    keywords: [
      "water supply", "pipeline", "sewage", "plumbing", "drainage",
      "pump", "water treatment", "wtp", "stp", "sewage treatment",
      "septic", "borewell", "overhead tank", "reservoir", "rising main",
      "distribution network", "sewer",
    ],
  },
  {
    category: "STATIONERY",
    keywords: [
      "stationery", "paper", "register", "file", "folder", "pen",
      "ink", "cartridge", "toner", "envelope", "stamp pad",
      "office supply", "supplies",
    ],
  },
  {
    category: "CONSULTING",
    keywords: [
      "consulting", "consultancy", "consultant", "advisory", "advisory",
      "feasibility", "dpr", "detailed project report", "master plan",
      "project management", "pmc", "planning", "survey", "study",
      "assessment", "audit", "valuation", "empanelment of",
    ],
  },
];

/**
 * Scores the input text against each category's keyword list.
 * Returns the category with the highest match count, or OTHER.
 */
export function detectCategory(title: string, description = ""): TenderCategory {
  const text = `${title} ${description}`.toLowerCase();

  let bestCategory: TenderCategory = "OTHER";
  let bestScore = 0;

  for (const { category, keywords } of KEYWORD_MAP) {
    const score = keywords.reduce(
      (acc, kw) => acc + (text.includes(kw) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}
