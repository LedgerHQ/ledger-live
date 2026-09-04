import React, { useCallback, useEffect, useRef } from "react";
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Spot,
  Text,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import { InformationFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { DisabledItemExplanation } from "LLM/features/ModularDrawer";
import { BottomSheetInfoGradient } from "LLM/components/BottomSheetGradient";
import { useTranslation } from "~/context/Locale";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = Readonly<{
  explanation: DisabledItemExplanation | null;
  onClose: () => void;
}>;

export function UnsupportedSelectionSheet({ explanation, onClose }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const bottomSheetRef = useBottomSheetRef();
  const isClosingRef = useRef(true);

  useEffect(() => {
    if (explanation) {
      isClosingRef.current = false;
      bottomSheetRef.current?.present();
    } else {
      isClosingRef.current = true;
      bottomSheetRef.current?.dismiss();
    }
  }, [bottomSheetRef, explanation]);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;

    isClosingRef.current = true;
    onClose();
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef, onClose]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={null}
      enableDynamicSizing
      maxDynamicContentSize="fullWithOffset"
      backdropPressBehavior="close"
      backgroundComponent={BottomSheetInfoGradient}
      onClose={handleClose}
      enablePanDownToClose
      testID="contacts-unsupported-selection-sheet"
    >
      {explanation ? (
        <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
          <BottomSheetHeader density="compact" />
          <Box lx={{ alignItems: "center", gap: "s24", paddingHorizontal: "s16" }}>
            <Spot appearance="icon" icon={InformationFill} size={56} />
            <Box lx={{ alignItems: "center", gap: "s8" }}>
              <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
                {explanation.title}
              </Text>
              <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
                {explanation.content}
              </Text>
            </Box>
            <Button appearance="base" size="lg" isFull onPress={handleClose}>
              {t("common.gotit")}
            </Button>
          </Box>
        </BottomSheetView>
      ) : null}
    </BottomSheet>
  );
}
