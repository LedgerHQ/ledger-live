import React, { useCallback, useEffect, useMemo } from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { ConfirmationStatusLayout } from "../ConfirmationStatusLayout";
import { useAnalytics } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import { useSendFlowData } from "../../../../context/SendFlowContext";

export type ConfirmationScreenViewProps = Readonly<{
  title: string;
  description: string;
  viewTransactionLabel: string;
  closeLabel: string;
  canViewTransaction: boolean;
  onViewTransaction: () => void;
  onClose: () => void;
}>;

export function ConfirmationScreenView({
  title,
  description,
  viewTransactionLabel,
  closeLabel,
  canViewTransaction,
  onViewTransaction,
  onClose,
}: ConfirmationScreenViewProps) {
  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;

  const { track } = useAnalytics();
  const trackingProperties = useMemo(() => {
    return getSendFlowTrackingProperties(account ?? null, parentAccount);
  }, [account, parentAccount]);

  useEffect(() => {
    track("transaction_drawer", {
      ...trackingProperties,
      name: "transaction details",
      flow: "send",
    });
  }, [track, trackingProperties]);

  const handleViewTransaction = useCallback(() => {
    track("button_clicked", {
      ...trackingProperties,
      button: "view details",
      page: "step confirmation",
      flow: "send",
    });
    onViewTransaction();
  }, [track, trackingProperties, onViewTransaction]);

  const handleClose = useCallback(() => {
    track("button_clicked", {
      ...trackingProperties,
      button: "close",
      page: "transaction details",
      flow: "send",
    });
    onClose();
  }, [track, trackingProperties, onClose]);

  useEffect(() => {
    track("send_modal", { ...trackingProperties, name: "step confirmation" });
  }, [track, trackingProperties]);

  return (
    <ConfirmationStatusLayout
      tone="success"
      title={title}
      description={description}
      testID="send-confirmation-success"
      actions={
        <>
          {canViewTransaction ? (
            <Button
              appearance="gray"
              size="lg"
              lx={{ width: "full" }}
              onPress={handleViewTransaction}
              testID="send-confirmation-success-view-transaction"
            >
              {viewTransactionLabel}
            </Button>
          ) : null}
          <Button
            appearance="base"
            size="lg"
            lx={{ width: "full" }}
            onPress={handleClose}
            testID="send-confirmation-success-close"
          >
            {closeLabel}
          </Button>
        </>
      }
    />
  );
}
