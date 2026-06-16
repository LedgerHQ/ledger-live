import React from "react";
import { Button, Link } from "@ledgerhq/lumen-ui-rnative";
import TranslatedError from "~/components/TranslatedError";
import { ConfirmationStatusLayout } from "../ConfirmationStatusLayout";

export type ConfirmationErrorViewProps = Readonly<{
  error: Error | null;
  saveLogsLabel: string;
  retryLabel: string;
  closeLabel: string;
  onSaveLogs: () => void;
  onRetry: () => void;
  onClose: () => void;
}>;

export function ConfirmationErrorView({
  error,
  saveLogsLabel,
  retryLabel,
  closeLabel,
  onSaveLogs,
  onRetry,
  onClose,
}: ConfirmationErrorViewProps) {
  return (
    <ConfirmationStatusLayout
      tone="error"
      title={error ? <TranslatedError error={error} field="title" /> : undefined}
      description={error ? <TranslatedError error={error} field="description" /> : undefined}
      testID="send-confirmation-error"
      belowDescription={
        <Link
          appearance="accent"
          size="md"
          underline={false}
          onPress={onSaveLogs}
          testID="send-confirmation-error-save-logs"
        >
          {saveLogsLabel}
        </Link>
      }
      actions={
        <>
          <Button
            appearance="base"
            size="lg"
            lx={{ width: "full" }}
            onPress={onRetry}
            testID="send-confirmation-error-retry"
          >
            {retryLabel}
          </Button>
          <Button
            appearance="gray"
            size="lg"
            lx={{ width: "full" }}
            onPress={onClose}
            testID="send-confirmation-error-close"
          >
            {closeLabel}
          </Button>
        </>
      }
    />
  );
}
