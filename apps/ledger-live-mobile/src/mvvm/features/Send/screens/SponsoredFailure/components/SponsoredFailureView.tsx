import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { InfoState } from "@shared/ui-info-state";

type SponsoredFailureViewProps = Readonly<{
  message: string | null;
  retryBlockedMessage: string | null;
  retryLabel: string;
  retryDisabled: boolean;
  cancelLabel: string;
  onRetry: () => void;
  onCancel: () => void;
}>;

export function SponsoredFailureView({
  message,
  retryBlockedMessage,
  retryLabel,
  retryDisabled,
  cancelLabel,
  onRetry,
  onCancel,
}: SponsoredFailureViewProps) {
  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }}>
      <InfoState
        preset="error"
        description={message ?? undefined}
        banner={
          retryBlockedMessage ? { appearance: "error", title: retryBlockedMessage } : undefined
        }
        primaryCta={{
          label: retryLabel,
          onPress: onRetry,
          disabled: retryDisabled,
          testID: "send-sponsored-failure-retry",
        }}
        secondaryCta={{
          label: cancelLabel,
          onPress: onCancel,
          testID: "send-sponsored-failure-cancel",
        }}
        testID="send-sponsored-failure"
      />
    </Box>
  );
}
