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
import { CoinControlScreen } from "./screens/CoinControl";
import { aleoSendStepRegistry } from "~/families/aleo/send";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";

const baseStepRegistry: StepRegistry<SendFlowStep> = {
  [SEND_FLOW_STEP.RECIPIENT]: RecipientScreen,
  [SEND_FLOW_STEP.RECENT_HISTORY]: () => <></>,
  [SEND_FLOW_STEP.AMOUNT]: AmountScreen,
  [SEND_FLOW_STEP.CUSTOM_FEES]: () => <></>,
  [SEND_FLOW_STEP.COIN_CONTROL]: CoinControlScreen,
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

  // Determine if we need Aleo-specific step registry
  const stepRegistry = useMemo(() => {
    console.log("[SendFlow] stepRegistry useMemo triggered");
    const account = initParams.account;
    console.log("[SendFlow] Account:", account?.id, account?.currency);

    if (!account) {
      console.log("[SendFlow] No account, using base registry");
      return baseStepRegistry;
    }

    const currency = getAccountCurrency(account);
    console.log("[SendFlow] Currency ID:", currency?.id, "name:", currency?.name);

    const isAleo = currency?.id === "aleo" || currency?.id === "aleo_testnet";
    console.log("[SendFlow] isAleo:", isAleo);

    if (isAleo) {
      console.log("[SendFlow] ✅ Using Aleo step registry - merging overrides");
      console.log("[SendFlow] Aleo steps:", Object.keys(aleoSendStepRegistry));
      // Merge Aleo-specific steps with base registry
      return {
        ...baseStepRegistry,
        ...aleoSendStepRegistry,
      };
    }

    console.log("[SendFlow] Using base step registry (not Aleo)");
    return baseStepRegistry;
  }, [initParams.account]);

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
