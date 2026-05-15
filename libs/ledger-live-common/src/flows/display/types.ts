import type { DisplayTokenItem, DisplayTxItem } from "../../bridge/descriptor/types";
import type { FlowConfig, FlowStepConfig } from "../wizard/types";

/**
 * Display POC flow — step vocabulary.
 *
 * - BALANCE: shows the account balance from the descriptor
 * - TRANSACTIONS: shows the 5 most recent (mocked) transactions
 * - TOKENS: shows the list of (mocked) tokens — only present when the family supports tokens
 */
export const DISPLAY_FLOW_STEP = {
  BALANCE: "BALANCE",
  TRANSACTIONS: "TRANSACTIONS",
  TOKENS: "TOKENS",
} as const;

export type DisplayFlowStep = (typeof DISPLAY_FLOW_STEP)[keyof typeof DISPLAY_FLOW_STEP];

export type DisplayFlowStepConfig = FlowStepConfig<DisplayFlowStep>;
export type DisplayFlowConfig = FlowConfig<DisplayFlowStep, DisplayFlowStepConfig>;

/**
 * Generic Display UI config, derived from the currency's `DisplayDescriptor`.
 *
 * Screens consume this object only — they never branch on coin family.
 */
export type DisplayFlowUiConfig = Readonly<{
  balance: string;
  recentTransactions: readonly DisplayTxItem[];
  hasTokens: boolean;
  tokens: readonly DisplayTokenItem[];
}>;
