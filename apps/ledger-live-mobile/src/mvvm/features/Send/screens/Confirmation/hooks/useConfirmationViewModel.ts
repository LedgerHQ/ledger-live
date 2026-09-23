import { useCallback, useEffect, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import type { BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";
import useExportLogs from "~/components/useExportLogs";
import { screen } from "~/analytics";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import { FLOW_STATUS } from "@ledgerhq/live-common/flows/wizard/types";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSendSignature } from "../../../context/SendSignatureContext";
import { useSendFlowTracking } from "../../../context/SendFlowTrackingContext";
import { getActiveWarningsTrackingProperties } from "../../../utils/tracking";
import { getActiveWarningIds } from "../../../utils/messageTracking";
import type { SendFlowNavigationProp } from "../../../types";

export function useConfirmationViewModel() {
  const navigation = useNavigation<BaseNavigationComposite<SendFlowNavigationProp>>();
  const { close, status: statusActions, operation } = useSendFlowActions();
  const { startSigning } = useSendSignature();
  const { state } = useSendFlowData();
  const { endSession, flowSessionId, recipientType, savedContactDuringFlow, trackMessage } =
    useSendFlowTracking();
  const { account, parentAccount } = state.account;
  const onSaveLogs = useExportLogs();
  const sendFlowTrackingProperties = useSendFlowTrackingProperties();
  const trackingProperties = useMemo(
    () => ({
      ...sendFlowTrackingProperties,
      recipientType,
    }),
    [sendFlowTrackingProperties, recipientType],
  );

  const optimisticOperation = state.operation.optimisticOperation;
  const concernedOperation =
    optimisticOperation?.subOperations?.find(op => op.accountId === account?.id) ??
    optimisticOperation ??
    null;

  const transactionStatus = state.transaction.status;
  const activeWarningsTrackingProperties = useMemo(
    () =>
      getActiveWarningsTrackingProperties(
        transactionStatus ? getActiveWarningIds(transactionStatus) : [],
      ),
    [transactionStatus],
  );

  useEffect(() => {
    if (state.flowStatus === FLOW_STATUS.SUCCESS) {
      void screen("Modal send - transaction sent", undefined, {
        ...trackingProperties,
        flow_session_id: flowSessionId,
        savedContactDuringFlow,
        ...activeWarningsTrackingProperties,
      });
      endSession();
    }
  }, [
    activeWarningsTrackingProperties,
    endSession,
    flowSessionId,
    savedContactDuringFlow,
    state.flowStatus,
    trackingProperties,
  ]);

  const transactionError = state.operation.transactionError;
  const isSigned = Boolean(state.operation.signed);
  useEffect(() => {
    if (!transactionError || state.flowStatus !== FLOW_STATUS.ERROR) return;

    trackMessage({
      account,
      parentAccount,
      step: isSigned ? SEND_FLOW_STEP.CONFIRMATION : SEND_FLOW_STEP.SIGNATURE,
      message: {
        messageId: transactionError.name,
        messageType: "error",
      },
    });
  }, [account, isSigned, parentAccount, state.flowStatus, trackMessage, transactionError]);

  const onViewTransaction = useCallback(() => {
    if (!account || !concernedOperation) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      parentId: parentAccount?.id ?? undefined,
      operation: concernedOperation,
    });
  }, [account, parentAccount, concernedOperation, navigation]);

  const onRetry = useCallback(() => {
    operation.onRetry();
    statusActions.resetStatus();
    startSigning();
  }, [operation, statusActions, startSigning]);

  return {
    status: state.flowStatus,
    transactionError,
    canViewTransaction: Boolean(account && concernedOperation),
    trackingProperties,
    onViewTransaction,
    onSaveLogs,
    onRetry,
    onClose: close,
  };
}
