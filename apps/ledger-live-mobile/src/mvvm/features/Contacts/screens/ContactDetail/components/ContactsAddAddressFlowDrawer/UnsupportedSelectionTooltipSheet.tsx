import React, { useCallback, useEffect } from "react";
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
import type { DisabledItemTooltip } from "LLM/features/ModularDrawer";
import { useTranslation } from "~/context/Locale";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = Readonly<{
  tooltip: DisabledItemTooltip | null;
  onClose: () => void;
}>;

export function UnsupportedSelectionTooltipSheet({ tooltip, onClose }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const bottomSheetRef = useBottomSheetRef();

  useEffect(() => {
    if (tooltip) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [bottomSheetRef, tooltip]);

  const handleClose = useCallback(() => {
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
      onClose={onClose}
      enablePanDownToClose
      testID="contacts-unsupported-selection-tooltip"
    >
      {tooltip ? (
        <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
          <BottomSheetHeader density="compact" />
          <Box lx={{ alignItems: "center", gap: "s24", paddingHorizontal: "s16" }}>
            <Spot appearance="icon" icon={InformationFill} size={56} />
            <Box lx={{ alignItems: "center", gap: "s8" }}>
              <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
                {tooltip.title}
              </Text>
              <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
                {tooltip.content}
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
