import React from "react";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { NetworkWarning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { InfoState } from "@shared/ui-info-state";
import type { CardAuthErrorProps } from "./types";

export function CardAuthError({ error }: CardAuthErrorProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isForcingToBeOpened={error !== null}
      onClose={error?.onDismiss}
      enableDynamicSizing
      testID="card-auth-error-sheet"
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        {error ? (
          <InfoState
            preset="spot"
            spotProps={{ icon: NetworkWarning }}
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
    </QueuedBottomSheet>
  );
}
