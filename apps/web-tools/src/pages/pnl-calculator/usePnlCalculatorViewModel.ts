import { useState } from "react";
import type { ScenarioId } from "./scenarios";

export function usePnlCalculatorViewModel() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>("singleTrade");

  return {
    selectedScenario,
    setSelectedScenario,
  };
}

export type PnlCalculatorViewModel = ReturnType<typeof usePnlCalculatorViewModel>;
