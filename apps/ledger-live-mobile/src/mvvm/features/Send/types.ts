import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ReactNativeFlowStepConfig, ReactNativeFlowConfig } from "../FlowWizard/types";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import type { NetworkFeesInfo } from "@ledgerhq/live-common/bridge/descriptor/types";
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
};

export type SendFlowNavigationProp = NativeStackNavigationProp<SendFlowStackParamList>;

export type NetworkFeesViewModel = Readonly<{
  label: string;
  value: string;
  strategyLabel: string;
  /** When true, `value` already includes the native fee-currency amount (with fiat when a rate exists); the row omits the strategy label. */
  showFeeCurrencyAmount: boolean;
  selectedFeeStrategy: string | null;
  displayOptions: readonly FeeSelectorOption[];
  canOpenSelector: boolean;
  networkFeesInfo: NetworkFeesInfo | null;
}>;
