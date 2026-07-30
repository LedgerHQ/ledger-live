import React, { useCallback } from "react";
import { Pressable } from "react-native";
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import { BottomSheetInfoGradient } from "LLM/components/BottomSheetGradient";
import { InfoState } from "LLM/components/InfoState";
import { useTranslation } from "~/context/Locale";

/**
 * Info icon shown next to the read-only recipient address, opening a sheet that
 * reminds the user to verify the full address on their Ledger device.
 */
export function AddressDisclaimer() {
  const { t } = useTranslation();
  const sheetRef = useBottomSheetRef();

  const handleOpen = useCallback(() => {
    sheetRef.current?.present();
  }, [sheetRef]);

  const handleClose = useCallback(() => {
    sheetRef.current?.dismiss();
  }, [sheetRef]);

  return (
    <>
      <Pressable
        testID="send-address-disclaimer-button"
        accessibilityRole="button"
        accessibilityLabel={t("send.newSendFlow.addressDisclaimer.accessibilityLabel")}
        onPress={handleOpen}
      >
        <Information size={20} lx={{ color: "muted" }} />
      </Pressable>
      <BottomSheet
        ref={sheetRef}
        enableDynamicSizing
        snapPoints={null}
        backgroundComponent={BottomSheetInfoGradient}
      >
        <BottomSheetView>
          <BottomSheetHeader density="compact" />
          <InfoState
            preset="info"
            size="hug"
            title={t("send.newSendFlow.addressDisclaimer.title")}
            description={t("send.newSendFlow.addressDisclaimer.description")}
            primaryCta={{
              label: t("common.gotit"),
              onPress: handleClose,
            }}
          />
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}
