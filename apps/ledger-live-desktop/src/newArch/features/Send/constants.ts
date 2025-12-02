import {
  SEND_FLOW_STEP,
  type SendFlowStep,
  type SendStepConfig,
  type SendFlowConfig,
  type SendFlowCurrencyConfig,
} from "./types";

export const SEND_FLOW_STEP_ORDER: readonly SendFlowStep[] = [
  SEND_FLOW_STEP.ACCOUNT_SELECTION,
  SEND_FLOW_STEP.RECIPIENT,
  SEND_FLOW_STEP.AMOUNT,
  SEND_FLOW_STEP.SIGNATURE,
  SEND_FLOW_STEP.CONFIRMATION,
];

export const SEND_STEP_CONFIGS: Record<SendFlowStep, SendStepConfig> = {
  [SEND_FLOW_STEP.ACCOUNT_SELECTION]: {
    id: SEND_FLOW_STEP.ACCOUNT_SELECTION,
    canGoBack: false,
    showHeader: false,
  },
  [SEND_FLOW_STEP.RECIPIENT]: {
    id: SEND_FLOW_STEP.RECIPIENT,
    canGoBack: true,
    showHeader: true,
  },
  [SEND_FLOW_STEP.AMOUNT]: {
    id: SEND_FLOW_STEP.AMOUNT,
    canGoBack: true,
    showHeader: true,
  },
  [SEND_FLOW_STEP.SIGNATURE]: {
    id: SEND_FLOW_STEP.SIGNATURE,
    canGoBack: true,
    showHeader: false,
  },
  [SEND_FLOW_STEP.CONFIRMATION]: {
    id: SEND_FLOW_STEP.CONFIRMATION,
    canGoBack: false,
    showHeader: false,
  },
};

export const SEND_FLOW_CONFIG: SendFlowConfig = {
  stepOrder: SEND_FLOW_STEP_ORDER,
  stepConfigs: SEND_STEP_CONFIGS,
};

export const DEFAULT_CURRENCY_CONFIG: SendFlowCurrencyConfig = {
  hasMemo: false,
  hasDestinationTag: false,
};

export const CURRENCY_CONFIGS: Record<string, Partial<SendFlowCurrencyConfig>> = {
  stellar: { hasMemo: true, memoLabel: "Memo", memoPlaceholder: "Optional memo" },
  ripple: { hasDestinationTag: true },
  cosmos: { hasMemo: true, memoLabel: "Memo" },
  ton: { hasMemo: true, memoLabel: "Comment" },
  hedera: { hasMemo: true, memoLabel: "Memo" },
};

export function getCurrencyConfig(currencyId: string): SendFlowCurrencyConfig {
  return { ...DEFAULT_CURRENCY_CONFIG, ...CURRENCY_CONFIGS[currencyId] };
}
