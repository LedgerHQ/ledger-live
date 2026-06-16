import { useCallback, useEffect, useMemo } from "react";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { FLOW_STATUS } from "@ledgerhq/live-common/flows/wizard/types";
import { useSendFlowConfirmationCore } from "@ledgerhq/live-common/flows/send/confirmation/useSendFlowConfirmationCore";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { track, trackPage } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../../../utils/tracking";

export function useConfirmationViewModel() {
  const { navigation } = useFlowWizard<SendFlowStep>();
  const { close, status: statusActions, operation } = useSendFlowActions();
  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;
  const sendFlowTrackingProperties = useMemo(
    () => getSendFlowTrackingProperties(account, parentAccount),
    [account, parentAccount],
  );

  const navigateToSignature = useCallback(() => navigation.goToStep("SIGNATURE"), [navigation]);

  const { status, transactionError, concernedOperation, onRetry } = useSendFlowConfirmationCore({
    operation: state.operation,
    currency: state.account.currency,
    operationActions: operation,
    statusActions,
    navigateToSignature,
  });

  useEffect(() => {
    switch (status) {
      case FLOW_STATUS.SUCCESS:
        trackPage("Modal send - transaction sent", null, sendFlowTrackingProperties);
        break;
      case FLOW_STATUS.IDLE:
        trackPage("Modal send - action rejected", null, sendFlowTrackingProperties);
        break;
    }
  }, [status, sendFlowTrackingProperties]);

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

  const onClose = useCallback(() => {
    close();
  }, [close]);

  return {
    status,
    transactionError,
    onViewDetails,
    onRetry,
    onClose,
  };
}
