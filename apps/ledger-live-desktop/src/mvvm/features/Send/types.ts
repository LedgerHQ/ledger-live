import type { FlowStepConfig, FlowConfig } from "@ledgerhq/live-common/flows/wizard/types";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";

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
