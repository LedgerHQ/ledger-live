import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ReactNativeFlowStepConfig, ReactNativeFlowConfig } from "../FlowWizard/types";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { ScreenName } from "~/const";
import { FeePresetOption } from "@ledgerhq/live-common/bridge/descriptor";

export type SendStepConfig = ReactNativeFlowStepConfig<SendFlowStep> &
  Readonly<{
    addressInput?: boolean;
    showTitle?: boolean;
    showHeaderRight?: boolean;
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
  showFeePresets: boolean;
  selectedFeeStrategy: string | null;
  feePresetOptions: readonly FeePresetOption[];
  onSelectFeeStrategy: (strategy: string) => void;
  onSelectCoinControl?: () => void;
  uiConfig?: Readonly<{
    hasCustomFees: boolean;
    hasCoinControl: boolean;
  }>;
}>;
