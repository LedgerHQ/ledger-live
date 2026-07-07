import React, { memo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetView, Text } from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";

type Props = Readonly<{
  title: string;
  description: string;
  disclaimer?: string;
  isOpen: boolean;
  onClose: () => void;
}>;

function MarketInsightDefinitionSheet({ title, description, disclaimer, isOpen, onClose }: Props) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  const content = (
    <>
      <Text typography="heading2SemiBold" lx={{ color: "base", marginBottom: "s12" }}>
        {title}
      </Text>
      <Text typography="body1" lx={{ color: "base" }}>
        {description}
      </Text>
      {disclaimer ? (
        <Text typography="body4" lx={{ color: "muted", marginTop: "s16" }}>
          {disclaimer}
        </Text>
      ) : null}
    </>
  );

  return (
    <QueuedDrawerBottomSheet isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        {content}
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}

export default memo(MarketInsightDefinitionSheet);
