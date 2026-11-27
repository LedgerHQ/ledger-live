import React, { useState } from "react";
import { BottomSheetHeader, BottomSheetView, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";

type Props = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  info: string;
  testID?: string;
}>;

function InfoSheetContent({ title, info }: Pick<Props, "title" | "info">) {
  const bottomInset = useBottomSheetBottomInset();
  const styles = useStyleSheet(
    t => ({ content: { paddingBottom: t.spacings.s24 + bottomInset } }),
    [bottomInset],
  );

  return (
    <BottomSheetView style={styles.content}>
      <BottomSheetHeader title={title} density="expanded" />
      <Text typography="body1" lx={{ color: "base" }}>
        {info}
      </Text>
    </BottomSheetView>
  );
}

export function InfoSheet({ isOpen, onClose, testID, ...contentProps }: Props) {
  const [hasBeenOpened, setHasBeenOpened] = useState(isOpen);
  if (isOpen && !hasBeenOpened) setHasBeenOpened(true);

  if (!hasBeenOpened) return null;

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      testID={testID}
    >
      <InfoSheetContent {...contentProps} />
    </QueuedBottomSheet>
  );
}
