import { DISPLAY_FLOW_STEP, type DisplayFlowStep } from "@ledgerhq/live-common/flows/display/types";
import type { DisplayFlowConfig, DisplayStepConfig } from "./types";

/**
 * Static order of steps in the Display POC flow.
 *
 * Note: the TOKENS step is always present here, but the layout skips it at
 * runtime when the descriptor reports `hasTokens === false`.
 */
const DISPLAY_FLOW_STEP_ORDER: readonly DisplayFlowStep[] = [
  DISPLAY_FLOW_STEP.BALANCE,
  DISPLAY_FLOW_STEP.TRANSACTIONS,
  DISPLAY_FLOW_STEP.TOKENS,
];

const DISPLAY_STEP_CONFIGS: Record<DisplayFlowStep, DisplayStepConfig> = {
  [DISPLAY_FLOW_STEP.BALANCE]: {
    id: DISPLAY_FLOW_STEP.BALANCE,
    canGoBack: false,
    titleKey: "Balance",
  },
  [DISPLAY_FLOW_STEP.TRANSACTIONS]: {
    id: DISPLAY_FLOW_STEP.TRANSACTIONS,
    canGoBack: true,
    titleKey: "Recent transactions",
  },
  [DISPLAY_FLOW_STEP.TOKENS]: {
    id: DISPLAY_FLOW_STEP.TOKENS,
    canGoBack: true,
    titleKey: "Tokens",
  },
};

export const DISPLAY_FLOW_CONFIG: DisplayFlowConfig = {
  stepOrder: DISPLAY_FLOW_STEP_ORDER,
  stepConfigs: DISPLAY_STEP_CONFIGS,
  initialStep: DISPLAY_FLOW_STEP.BALANCE,
};
