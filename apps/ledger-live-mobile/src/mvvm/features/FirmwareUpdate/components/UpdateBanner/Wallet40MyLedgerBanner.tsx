import React from "react";
import { Button, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import type { DrawerProps } from "./ViewProps";
import UnsupportedUpdateDrawer from "./UnsupportedUpdateDrawer";

type Wallet40MyLedgerBannerProps = {
  productName: string | undefined;
  version: string;
  onClickUpdate: () => void;
  drawerProps: DrawerProps;
};

const Wallet40MyLedgerBanner = ({
  productName,
  version,
  onClickUpdate,
  drawerProps,
}: Wallet40MyLedgerBannerProps) => {
  const { t } = useTranslation();
  return (
    <>
      <Box
        lx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "accent",
          borderRadius: "md",
          padding: "s16",
        }}
      >
        <Box lx={{ flexDirection: "column", alignItems: "flex-start", flexShrink: 1 }}>
          <Text typography="heading5SemiBold" lx={{ color: "black" }}>
            {t("FirmwareUpdate.banner.wallet40.title.manager")}
          </Text>
          <Text typography="body2" lx={{ color: "black" }}>
            {t("FirmwareUpdate.banner.wallet40.version", {
              productName,
              firmwareVersion: version,
            })}
          </Text>
        </Box>
        <Box>
          <Button appearance="gray" size="sm" onPress={onClickUpdate}>
            {t("FirmwareUpdate.banner.wallet40.cta", {
              productName,
              firmwareVersion: version,
            })}
          </Button>
        </Box>
      </Box>
      <UnsupportedUpdateDrawer
        isOpen={drawerProps.unsupportedUpdateDrawerOpened}
        onClose={drawerProps.closeUnsupportedUpdateDrawer}
        isUsbRequired={drawerProps.isUpdateSupportedButDeviceNotWired}
        productName={drawerProps.productName}
        noCloseButton
      />
    </>
  );
};

export default Wallet40MyLedgerBanner;
