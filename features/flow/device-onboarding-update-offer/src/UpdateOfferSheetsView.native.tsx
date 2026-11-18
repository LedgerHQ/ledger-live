import React, { type ReactNode } from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InfoState } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { updateOfferTestIds } from "./internals";
import type { UpdateOfferSheetsViewProps } from "./useUpdateOfferSheetsViewModel";

type UpdateSheetProps = Readonly<{
  isOpen: boolean;
  testID: string;
  onHeaderClosePressed?: () => void;
  onDismiss?: () => void;
  canSwipeToClose: boolean;
  children: ReactNode;
}>;

function UpdateSheet({
  isOpen,
  testID,
  onHeaderClosePressed,
  onDismiss,
  canSwipeToClose,
  children,
}: UpdateSheetProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onHeaderClosePressed={onHeaderClosePressed}
      onClose={onDismiss}
      preventBackdropClick
      enablePanDownToClose={canSwipeToClose}
      enableDynamicSizing
      contentHasBottomSpace
      testID={testID}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Box lx={{ paddingHorizontal: "s16" }}>{children}</Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}

export function UpdateOfferSheetsView({ offer, skip }: UpdateOfferSheetsViewProps) {
  return (
    <>
      <UpdateSheet
        isOpen={offer.isOpen}
        testID={updateOfferTestIds.offerSheet}
        onHeaderClosePressed={offer.onClose}
        canSwipeToClose={false}
      >
        <InfoState
          preset="info"
          size="hug"
          title={offer.title}
          description={offer.description}
          primaryCta={{
            label: offer.updateLabel,
            onPress: offer.onUpdate,
            testID: updateOfferTestIds.offerUpdate,
          }}
        />
      </UpdateSheet>
      <UpdateSheet
        isOpen={skip.isOpen}
        testID={updateOfferTestIds.skipSheet}
        onDismiss={skip.onDismiss}
        canSwipeToClose
      >
        <InfoState
          preset="info"
          size="hug"
          title={skip.title}
          description={skip.description}
          primaryCta={{
            label: skip.updateLabel,
            onPress: skip.onUpdate,
            testID: updateOfferTestIds.skipUpdate,
          }}
          secondaryCta={{
            label: skip.skipLabel,
            onPress: skip.onSkip,
            testID: updateOfferTestIds.skipConfirm,
          }}
        />
      </UpdateSheet>
    </>
  );
}
