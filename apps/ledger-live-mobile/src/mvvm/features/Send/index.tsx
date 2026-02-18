import React, { useCallback, useMemo } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  SEND_FLOW_STEP,
  type SendFlowStep,
  type SendFlowInitParams,
} from "@ledgerhq/live-common/flows/send/types";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";

import { SendFlowOrchestrator } from "./SendFlowOrchestrator";
import { SEND_FLOW_CONFIG } from "./constants";

import { RecipientScreen } from "./screens/Recipient";
import { AmountScreen } from "./screens/Amount";
import { ConfirmationScreen } from "./screens/Confirmation";
import { SignatureScreen } from "./screens/Signature";

const stepRegistry: StepRegistry<SendFlowStep> = {
  [SEND_FLOW_STEP.RECIPIENT]: RecipientScreen,
  [SEND_FLOW_STEP.AMOUNT]: AmountScreen,
  [SEND_FLOW_STEP.SIGNATURE]: SignatureScreen,
  [SEND_FLOW_STEP.CONFIRMATION]: ConfirmationScreen,
};

type SendWorkflowParams = Readonly<{
  account?: AccountLike;
  parentAccount?: Account;
  recipient?: string;
  amount?: string;
  memo?: string;
  fromMAD?: boolean;
}>;

type SendWorkflowRouteParams = {
  onClose?: () => void;
  params?: SendWorkflowParams;
  // Support flattened params from FabActions
  account?: AccountLike;
  parentAccount?: Account;
  recipient?: string;
  amount?: string;
  memo?: string;
  fromMAD?: boolean;
};

export default function SendWorkflow() {
  const route = useRoute();
  const navigation = useNavigation();

  const routeParams = route.params as SendWorkflowRouteParams | undefined;

  const { onClose, params } = routeParams || {};

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  }, [onClose, navigation]);

  // Support both nested params (params.account) and flattened params (account)
  const initParams: SendFlowInitParams = useMemo(
    () => ({
      account: params?.account ?? routeParams?.account,
      parentAccount: params?.parentAccount ?? routeParams?.parentAccount,
      recipient: params?.recipient ?? routeParams?.recipient,
      amount: params?.amount ?? routeParams?.amount,
      memo: params?.memo ?? routeParams?.memo,
      fromMAD: params?.fromMAD ?? routeParams?.fromMAD ?? false,
    }),
    [params, routeParams],
  );

  return (
    <DomainServiceProvider>
      <SendFlowOrchestrator
        initParams={initParams}
        onClose={handleClose}
        stepRegistry={stepRegistry}
        flowConfig={SEND_FLOW_CONFIG}
      />
    </DomainServiceProvider>
  );
}
