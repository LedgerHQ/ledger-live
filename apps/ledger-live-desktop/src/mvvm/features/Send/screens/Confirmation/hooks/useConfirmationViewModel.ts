import { useCallback, useEffect, useMemo } from "react";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import { TokenCurrency } from "@domain/entity-currency-token";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { FLOW_STATUS, type FlowStatus } from "@ledgerhq/live-common/flows/wizard/types";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";
import type { SendFlowOperationResult, SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { track, trackPage } from "~/renderer/analytics/segment";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import { getActiveWarningsTrackingProperties } from "../../../utils/tracking";
import { useSendFlowTracking } from "../../../context/SendFlowTrackingContext";
import { getActiveWarningIds } from "../../../utils/messageTracking";

function getConfirmationStatus(
  operation: SendFlowOperationResult,
  currency: TokenCurrency | CryptoCurrency | null,
): FlowStatus {
  const { signed, optimisticOperation, transactionError } = operation;

  if (signed && optimisticOperation) {
    return FLOW_STATUS.SUCCESS;
  }

  if (signed && transactionError && !optimisticOperation) {
    return FLOW_STATUS.ERROR;
  } else if (!signed && transactionError) {
    if (currency && sendFeatures.isUserRefusedTransactionError(currency, transactionError)) {
      return FLOW_STATUS.IDLE;
    }
    return FLOW_STATUS.ERROR;
  }
  return FLOW_STATUS.IDLE;
}

export function useConfirmationViewModel() {
  const { navigation } = useFlowWizard<SendFlowStep>();
  const { close, status: statusActions, operation } = useSendFlowActions();
  const { state } = useSendFlowData();
  const { endSession, flowSessionId, recipientType, savedContactDuringFlow, trackMessage } =
    useSendFlowTracking();
  const { account, parentAccount } = state.account;
  const sendFlowTrackingPropertiesBase = useSendFlowTrackingProperties();
  const sendFlowTrackingProperties = useMemo(
    () => ({
      ...sendFlowTrackingPropertiesBase,
      recipientType,
    }),
    [sendFlowTrackingPropertiesBase, recipientType],
  );

  const status = useMemo(
    () => getConfirmationStatus(state.operation, state.account.currency),
    [state.operation, state.account.currency],
  );
  const activeWarningsTrackingProperties = useMemo(
    () =>
      getActiveWarningsTrackingProperties(
        state.transaction?.status ? getActiveWarningIds(state.transaction.status) : [],
      ),
    [state.transaction?.status],
  );

  const optimisticOperation = state.operation.optimisticOperation;
  const concernedOperation = useMemo(
    () => optimisticOperation?.subOperations?.[0] ?? optimisticOperation ?? null,
    [optimisticOperation],
  );

  const transactionError = state.operation.transactionError;

  useEffect(() => {
    switch (status) {
      case FLOW_STATUS.SUCCESS:
        trackPage("Modal send - transaction sent", null, {
          ...sendFlowTrackingProperties,
          flow_session_id: flowSessionId,
          savedContactDuringFlow,
          ...activeWarningsTrackingProperties,
        });
        endSession();
        break;
      case FLOW_STATUS.IDLE:
        trackPage("Modal send - action rejected", null, sendFlowTrackingProperties);
        break;
    }
  }, [
    activeWarningsTrackingProperties,
    endSession,
    flowSessionId,
    savedContactDuringFlow,
    status,
    sendFlowTrackingProperties,
  ]);

  useEffect(() => {
    if (!transactionError || status !== FLOW_STATUS.ERROR) return;

    trackMessage({
      account,
      parentAccount,
      step: state.operation.signed ? "CONFIRMATION" : "SIGNATURE",
      message: {
        messageId: transactionError.name,
        messageType: "error",
      },
    });
  }, [account, parentAccount, state.operation.signed, status, trackMessage, transactionError]);

  const onViewDetails = useCallback(() => {
    close();
    if (account && concernedOperation) {
      track("send_modal", {
        button: "view details",
        page: "step confirmation",
        ...sendFlowTrackingProperties,
      });
      trackPage("Modal send - transaction details", null, sendFlowTrackingProperties);
      setDrawer(
        OperationDetails,
        {
          operationId: concernedOperation.id,
          accountId: account.id,
          parentId: parentAccount?.id,
        },
        {
          onRequestClose: () => {
            track("button_clicked", {
              button: "close transaction details",
              page: "transaction details",
              ...sendFlowTrackingProperties,
            });
            setDrawer();
          },
        },
      );
    }
  }, [close, account, concernedOperation, parentAccount, sendFlowTrackingProperties]);

  const onRetry = useCallback(() => {
    operation.onRetry();
    statusActions.resetStatus();
    navigation.goToStep("SIGNATURE");
  }, [navigation, operation, statusActions]);

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "close",
      page: "step confirmation",
      ...sendFlowTrackingProperties,
    });
    endSession();
    close();
  }, [close, endSession, sendFlowTrackingProperties]);

  return {
    status,
    transactionError,
    onViewDetails,
    onRetry,
    onClose,
  };
}
