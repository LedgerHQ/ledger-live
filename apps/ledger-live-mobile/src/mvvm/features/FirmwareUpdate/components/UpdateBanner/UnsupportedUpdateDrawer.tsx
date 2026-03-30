import React from "react";
import { DownloadMedium, UsbMedium } from "@ledgerhq/native-ui/assets/icons";
import { Button, Box, Text, BottomSheetView, BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { useTranslation } from "~/context/Locale";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type UnsupportedUpdateDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  isUsbRequired: boolean;
  productName: string | undefined;
  noCloseButton?: boolean;
};

const UnsupportedUpdateDrawer = ({
  isOpen,
  onClose,
  isUsbRequired,
  productName,
  noCloseButton,
}: UnsupportedUpdateDrawerProps) => {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  const Icon = isUsbRequired ? UsbMedium : DownloadMedium;
  const title = isUsbRequired
    ? t("FirmwareUpdate.drawerUpdate.pleaseConnectUsbTitle")
    : t("FirmwareUpdate.drawerUpdate.title");
  const description = isUsbRequired
    ? t("FirmwareUpdate.drawerUpdate.pleaseConnectUsbDescription", {
        deviceName: productName,
      })
    : t("FirmwareUpdate.drawerUpdate.description");

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      noCloseButton={noCloseButton}
      enableDynamicSizing
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Box lx={{ alignItems: "center", gap: "s16", paddingHorizontal: "s16" }}>
          <Icon size={48} />
          <Text typography="heading5SemiBold" lx={{ textAlign: "center" }}>
            {title}
          </Text>
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {description}
          </Text>
        </Box>
        <Box lx={{ paddingHorizontal: "s16", paddingTop: "s24" }}>
          <Button
            appearance="base"
            size="lg"
            onPress={onClose}
            testID="fw-update-drawer-unsupported-close-btn"
          >
            {t("common.close")}
          </Button>
        </Box>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
};

export default UnsupportedUpdateDrawer;
