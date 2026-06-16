import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { ConfirmationStatusLayout } from "../ConfirmationStatusLayout";

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
              onPress={onViewTransaction}
              testID="send-confirmation-success-view-transaction"
            >
              {viewTransactionLabel}
            </Button>
          ) : null}
          <Button
            appearance="base"
            size="lg"
            lx={{ width: "full" }}
            onPress={onClose}
            testID="send-confirmation-success-close"
          >
            {closeLabel}
          </Button>
        </>
      }
    />
  );
}
