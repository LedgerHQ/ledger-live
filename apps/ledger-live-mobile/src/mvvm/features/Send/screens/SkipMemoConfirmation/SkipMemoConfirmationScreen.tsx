import React from "react";
import { BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { SkipMemoConfirmationView } from "./components/SkipMemoConfirmationView";
import { useSkipMemoConfirmationViewModel } from "./hooks/useSkipMemoConfirmationViewModel";

type SkipMemoConfirmationScreenProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>;

export function SkipMemoConfirmationScreen({ isOpen, onClose }: SkipMemoConfirmationScreenProps) {
  const viewModel = useSkipMemoConfirmationViewModel({ onClose });
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <SkipMemoConfirmationView {...viewModel} />
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
