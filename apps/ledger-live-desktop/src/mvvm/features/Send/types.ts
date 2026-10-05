import type { FlowStepConfig, FlowConfig } from "@ledgerhq/live-common/flows/wizard/types";
import type { SendFlowStep, SendFlowBusinessContext } from "@ledgerhq/live-common/flows/send/types";
import type { FlowNavigationDirection, FlowNavigationActions } from "../FlowWizard/types";

export type SendStepConfig = FlowStepConfig<SendFlowStep> &
  Readonly<{
    addressInput?: boolean;
    showTitle?: boolean;
    height?: "fixed" | "fit";
    /**
     * A step that is not in an original order of previous <-> next paradigm
     */
    floating?: boolean;
    /** i18n key used as the header title, overrides the default flow title. */
    titleKey?: string;
    /** Explicit step to navigate to when the user presses Back. */
    backTarget?: SendFlowStep;
    /** Whether the "Available $XX" description is shown in the header. Defaults to true when showTitle is true. */
    showAvailable?: boolean;
    headerDensity?: "compact" | "expanded";
  }>;

export type SendFlowConfig = FlowConfig<SendFlowStep, SendStepConfig>;

export type NavigationDirection = FlowNavigationDirection;

export type SendFlowNavigationActions = FlowNavigationActions<SendFlowStep>;

export type SendFlowContextValue = SendFlowBusinessContext &
  Readonly<{
    navigation: SendFlowNavigationActions;
    currentStep: SendFlowStep;
    direction: NavigationDirection;
    currentStepConfig: SendStepConfig;
  }>;

/** A fee amount: `value` leads, `secondaryValue` follows dimmed (the crypto amount when `value` is fiat). */
export type FeeAmountDisplay = Readonly<{ value: string; secondaryValue: string | null }>;

/** Each fee option priced in its own unit; only fiat is struck through, as both options share it. */
export type SponsoredFeeAmounts = Readonly<{
  sponsored: FeeAmountDisplay &
    Readonly<{
      /** The standard fee's fiat price, struck through; null unless both fiat prices exist and the sponsored one is lower. */
      originalValue: string | null;
    }>;
  standard: FeeAmountDisplay;
}>;
