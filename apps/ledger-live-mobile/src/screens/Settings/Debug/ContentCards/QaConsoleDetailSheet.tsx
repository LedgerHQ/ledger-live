import React from "react";
import { StyleSheet } from "react-native";
import { BottomSheetHeader, BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";

type QaConsoleDetailSheetProps = Readonly<{
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  scrollResetKey?: string | number;
}>;

export function QaConsoleDetailSheet({
  title,
  isOpen,
  onClose,
  children,
  scrollResetKey,
}: QaConsoleDetailSheetProps) {
  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      snapPoints={"full"}
      enablePanDownToClose
    >
      <BottomSheetHeader title={title} spacing density="expanded" />
      <BottomSheetScrollView key={scrollResetKey} contentContainerStyle={styles.content}>
        {children}
      </BottomSheetScrollView>
    </QueuedDrawerBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
});
