import React, { useCallback } from "react";
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { track } from "~/analytics";
import { SendFlowOrchestrator } from "./SendFlowOrchestrator";
import { SEND_FLOW_STEP, type SendFlowInitParams, type SendFlowStep } from "./types";
import { SignatureScreen } from "./screens/Signature/SignatureScreen";
import { ConfirmationScreen } from "./screens/Confirmation/ConfirmationScreen";
import { RecipientScreen } from "./screens/Recipient/RecipientScreen";
import { AmountScreen } from "./screens/Amount/AmountScreen";
import { FlowStackNavigator } from "../FlowWizard/FlowStackNavigator";
import { SEND_FLOW_CONFIG } from "./constants";
import type { StepRegistry } from "../FlowWizard/types";

// Simple helper to create a type-safe step registry
function createStepRegistry<TStep extends string>(
  registry: StepRegistry<TStep>,
): StepRegistry<TStep> {
  return registry;
}

export const stepRegistry = createStepRegistry({
  [SEND_FLOW_STEP.RECIPIENT]: RecipientScreen,
  [SEND_FLOW_STEP.AMOUNT]: AmountScreen,
  [SEND_FLOW_STEP.SIGNATURE]: SignatureScreen,
  [SEND_FLOW_STEP.CONFIRMATION]: ConfirmationScreen,
});

type SendWorkflowParams = Readonly<{
  account?: AccountLike;
  parentAccount?: Account;
  recipient?: string;
  amount?: string;
  memo?: string;
  fromMAD?: boolean;
  startWithWarning?: boolean;
}>;

type SendWorkflowProps = Readonly<{
  onClose?: () => void;
  params?: SendWorkflowParams;
  isOpen: boolean;
}>;

export default function SendWorkflow({ onClose, params, isOpen: _isOpen }: SendWorkflowProps) {
  const navigation = useNavigation();
  const route = useRoute();

  // Default exit process
  const exitProcess = useCallback(() => {
    const rootParent = navigation.getParent();
    if (rootParent) {
      const state = rootParent.getState();
      const homeRouteName = state.routeNames[0];

      rootParent.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: homeRouteName }],
        }),
      );
    }
  }, [navigation]);

  const handleClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      screen: route.name,
    });
    if (onClose) {
      onClose();
    } else {
      exitProcess();
    }
  }, [route, exitProcess, onClose]);

  const initParams: SendFlowInitParams = {
    account: params?.account,
    parentAccount: params?.parentAccount,
    recipient: params?.recipient,
    amount: params?.amount,
    memo: params?.memo,
    fromMAD: params?.fromMAD ?? false,
  };

  // Custom screen name generator based on step config
  const getScreenName = useCallback((step: SendFlowStep): string => {
    const stepConfig = SEND_FLOW_CONFIG.stepConfigs[step];
    return stepConfig.screenName || `NewSend${step}`;
  }, []);

  // For React Native, we use the FlowStackNavigator directly
  // The FlowStackNavigator handles the screen navigation dynamically based on the registry
  return (
    <SendFlowOrchestrator initParams={initParams} onClose={handleClose} stepRegistry={stepRegistry}>
      <FlowStackNavigator
        stepRegistry={stepRegistry}
        flowConfig={SEND_FLOW_CONFIG}
        getScreenName={getScreenName}
        onClose={handleClose}
      />
    </SendFlowOrchestrator>
  );
}
