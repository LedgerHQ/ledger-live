export const SCENARIO_IDS = ["singleTrade", "trader", "portfolio"] as const;
export type ScenarioId = (typeof SCENARIO_IDS)[number];

export const SCENARIO_LABELS: Record<ScenarioId, string> = {
  singleTrade: "Single trade",
  trader: "Trading",
  portfolio: "Portfolio",
};
