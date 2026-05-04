import React from "react";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import {
  SyncErrorBottomSheetContent,
  type SyncErrorBottomSheetContentProps,
} from "./SyncErrorBottomSheetContent";

export { SyncErrorBottomSheetContent } from "./SyncErrorBottomSheetContent";

type SyncErrorBottomSheetProps = SyncErrorBottomSheetContentProps & {
  isOpen: boolean;
};

export function SyncErrorBottomSheet({
  isOpen,
  onClose,
  listOfErrorAccountNames,
  onTryRefresh,
}: Readonly<SyncErrorBottomSheetProps>) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerBottomSheet isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader density="compact" />
        <SyncErrorBottomSheetContent
          onClose={onClose}
          listOfErrorAccountNames={listOfErrorAccountNames}
          onTryRefresh={onTryRefresh}
        />
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
