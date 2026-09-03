import React, { useCallback, useEffect } from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { ConfirmationStatusLayout } from "../ConfirmationStatusLayout";
import { track, usePageNameFromRoute } from "~/analytics";

export type ConfirmationScreenViewProps = Readonly<{
  title: string;
  description: string;
  viewTransactionLabel: string;
  closeLabel: string;
  canViewTransaction: boolean;
  trackingProperties: Record<string, unknown>;
  onViewTransaction: () => void;
  onClose: () => void;
}>;

export function ConfirmationScreenView({
  title,
  description,
  viewTransactionLabel,
  closeLabel,
  canViewTransaction,
  trackingProperties,
  onViewTransaction,
  onClose,
}: ConfirmationScreenViewProps) {
  const page = usePageNameFromRoute();

  useEffect(() => {
    track("transaction_drawer", {
      ...trackingProperties,
      name: "transaction details",
      page,
      flow: "send",
    });
  }, [page, trackingProperties]);

  const handleViewTransaction = useCallback(() => {
    track("button_clicked", {
      ...trackingProperties,
      button: "view details",
      page: "step confirmation",
      flow: "send",
    });
    onViewTransaction();
  }, [trackingProperties, onViewTransaction]);

  const handleClose = useCallback(() => {
    track("button_clicked", {
      ...trackingProperties,
      button: "close",
      page: "step confirmation",
      flow: "send",
    });
    onClose();
  }, [trackingProperties, onClose]);

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
