import React, { useState } from "react";
import {
  IconButton,
  Text,
  BottomSheetHeader,
  BottomSheetView,
  Button,
  Spot,
  Box,
} from "@ledgerhq/lumen-ui-rnative";
import { Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { ICON_SIZE } from "../const";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SyncStatusButtonProps = {
  isPending: boolean;
  listOfErrorAccountNames: string;
  accessibilityLabel: string;
};

export function SyncStatusButton({
  isPending,
  listOfErrorAccountNames,
  accessibilityLabel,
}: Readonly<SyncStatusButtonProps>) {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { bottom: bottomInset } = useSafeAreaInsets();

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <>
      <IconButton
        onPress={openDrawer}
        testID="topbar-sync"
        accessibilityLabel={accessibilityLabel}
        appearance="transparent"
        icon={({ size, style }) => <Warning size={size ?? ICON_SIZE} style={style} color="base" />}
        size="md"
        loading={isPending}
      />
      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={isDrawerOpen}
        onClose={closeDrawer}
        enableDynamicSizing
      >
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
          <Button appearance="base" size="lg" onPress={closeDrawer}>
            {t("syncIndicator.bottomSheet.close")}
          </Button>
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    </>
  );
}
