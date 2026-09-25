import React from "react";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { InfoState } from "@shared/ui-info-state";
import type { CardAuthErrorProps } from "./types";

export function CardAuthError({ error }: CardAuthErrorProps) {
  return (
    <QueuedBottomSheet
      isForcingToBeOpened={error !== null}
      onClose={error?.onDismiss}
      restoreOnFocus
      enableDynamicSizing
      testID="card-auth-error-sheet"
    >
      <CardAuthErrorContent error={error} />
    </QueuedBottomSheet>
  );
}

function CardAuthErrorContent({ error }: CardAuthErrorProps) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
      <BottomSheetHeader />
      {error ? (
        <InfoState
          preset="error"
          size="hug"
          title={error.title}
          description={error.description}
          primaryCta={{
            label: error.ctaLabel,
            onPress: error.onRetry,
            testID: "card-auth-error-cta",
          }}
          testID="card-auth-error"
        />
      ) : null}
    </BottomSheetView>
  );
}
