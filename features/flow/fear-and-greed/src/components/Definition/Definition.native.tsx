import React, { memo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetView, Text } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "@shared/i18n";

type DefinitionProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>;

function DefinitionComponent({ isOpen, onClose }: DefinitionProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Text
          typography="heading2SemiBold"
          lx={{ color: "base", marginBottom: "s12" }}
          testID="fear-and-greed-title"
        >
          {t("fearAndGreed.title")}
        </Text>
        <Text typography="body1" lx={{ color: "base" }}>
          {t("fearAndGreed.description")}
        </Text>
        <Text typography="body4" lx={{ color: "muted", marginTop: "s16" }}>
          {t("fearAndGreed.disclaimer")}
        </Text>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}

export const Definition = memo(DefinitionComponent);
