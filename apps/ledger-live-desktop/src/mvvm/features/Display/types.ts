import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type {
  DisplayFlowConfig as BaseConfig,
  DisplayFlowStep,
  DisplayFlowStepConfig as BaseStepConfig,
  DisplayFlowUiConfig,
} from "@ledgerhq/live-common/flows/display/types";
import type { FlowNavigationActions } from "../FlowWizard/types";

/**
 * LLD-specific extension of the live-common step config.
 * Add UI-only options (titles, layout hints, …) here if needed.
 */
export type DisplayStepConfig = BaseStepConfig &
  Readonly<{
    titleKey: string;
  }>;

export type DisplayFlowConfig = BaseConfig & {
  stepConfigs: Record<DisplayFlowStep, DisplayStepConfig>;
};

/**
 * Business context exposed to the Display screens through React context.
 *
 * The Display POC has no transactions, fees or status — only an account, its
 * currency, and the generic UI config built from the descriptor.
 */
export type DisplayFlowBusinessContext = Readonly<{
  account: AccountLike | null;
  parentAccount: Account | null;
  currency: CryptoOrTokenCurrency | null;
  uiConfig: DisplayFlowUiConfig;
  close: () => void;
}>;

export type DisplayFlowNavigationActions = FlowNavigationActions<DisplayFlowStep>;
