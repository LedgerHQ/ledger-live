import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ReactNativeFlowStepConfig, ReactNativeFlowConfig } from "../FlowWizard/types";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import type { NetworkFeesInfo } from "@ledgerhq/live-common/bridge/descriptor/types";
import type { SponsoredFeeAmounts } from "@ledgerhq/live-common/flows/send/sponsored/types";
import type {
  FeeSelectorOptionKind,
  FeeSelectorOption,
} from "@ledgerhq/live-common/flows/send/utils/feeSelectorOptions";
import { ScreenName } from "~/const";

export type { FeeSelectorOptionKind, FeeSelectorOption };

export type SendStepConfig = ReactNativeFlowStepConfig<SendFlowStep> &
  Readonly<{
    addressInput?: boolean;
    showTitle?: boolean;
    showHeaderRight?: boolean;
    floating?: boolean;
  }>;

export type SendFlowConfig = ReactNativeFlowConfig<SendFlowStep, SendStepConfig>;

// All the send flow data is stored in the context: atm it stays undefined
export type SendFlowStackParamList = {
  [ScreenName.SendFlowRecipient]: undefined;
  [ScreenName.SendFlowAmount]: undefined;
  [ScreenName.SendFlowCustomFees]: undefined;
  [ScreenName.SendFlowCoinControl]: undefined;
  [ScreenName.SendFlowSignature]: undefined;
  [ScreenName.SendFlowConfirmation]: undefined;
  [ScreenName.SendFlowPaySuccess]: undefined;
};

export type SendFlowNavigationProp = NativeStackNavigationProp<SendFlowStackParamList>;

export type NetworkFeesViewModel = Readonly<{
  label: string;
  value: string;
  /**
   * Native fee amount rendered after `value` in the muted colour. Only set when the fee is not
   * editable, where the row is the user's only view of what the network will take.
   */
  secondaryValue: string | null;
  strategyLabel: string;
  selectedFeeStrategy: string | null;
  displayOptions: readonly FeeSelectorOption[];
  canOpenSelector: boolean;
  networkFeesInfo: NetworkFeesInfo | null;
}>;

/** The sponsored fee on the network fees row, which opens the fee payment sheet. */
export type SponsoredFeeEntryViewModel = Readonly<{
  /** Nudge toward the sponsored fee, or its saving once picked; null when there is nothing to add. */
  label: string | null;
  selected: boolean;
  /** The picked sponsored fee, shown instead of the standard estimate; null while standard is picked. */
  fee: SponsoredFeeAmounts["sponsored"] | null;
  /** Replaces the network fees info while the sponsored fee is picked. */
  infoDescription: string | null;
  /** Why the sponsored pick can't go to Review; null while it can. */
  error: string | null;
}>;
