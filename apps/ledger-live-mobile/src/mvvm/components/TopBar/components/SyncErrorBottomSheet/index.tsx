import React from "react";
import {
  Text,
  BottomSheetHeader,
  BottomSheetView,
  Button,
  Spot,
  Box,
} from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";

type SyncErrorBottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  listOfErrorAccountNames: string;
};

export function SyncErrorBottomSheet({
  isOpen,
  onClose,
  listOfErrorAccountNames,
}: Readonly<SyncErrorBottomSheetProps>) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerBottomSheet isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader appearance="compact" />
        <Box lx={{ alignItems: "center", gap: "s24", marginBottom: "s32" }}>
          <Spot size={72} appearance="warning" />
          <Box lx={{ alignItems: "center" }}>
            <Text lx={{ marginBottom: "s12", color: "base" }} typography="heading4">
              {t("syncIndicator.bottomSheet.title")}
            </Text>
            {listOfErrorAccountNames.length > 0 && (
              <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
                {t("syncIndicator.bottomSheet.description", {
                  accounts: listOfErrorAccountNames,
                })}
              </Text>
            )}
          </Box>
        </Box>
        <Button appearance="base" size="lg" onPress={onClose}>
          {t("syncIndicator.bottomSheet.close")}
        </Button>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
