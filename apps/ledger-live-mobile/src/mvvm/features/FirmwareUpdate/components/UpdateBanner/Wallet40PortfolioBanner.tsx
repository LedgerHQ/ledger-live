import React from "react";
import { Button, Box } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import type { DrawerProps } from "./ViewProps";
import type { IconComponent } from "LLM/utils/getDeviceIcon";
import UnsupportedUpdateDrawer from "./UnsupportedUpdateDrawer";

type Wallet40PortfolioBannerProps = {
  deviceIcon: IconComponent;
  onClickUpdate: () => void;
  drawerProps: DrawerProps;
};

const Wallet40PortfolioBanner = ({
  deviceIcon,
  onClickUpdate,
  drawerProps,
}: Wallet40PortfolioBannerProps) => {
  const { t } = useTranslation();
  return (
    <>
      <Box lx={{ alignItems: "center", paddingTop: "s16", gap: "s10" }}>
        <Button
          appearance="transparent"
          size="sm"
          icon={deviceIcon}
          onPress={onClickUpdate}
          testID="fw-update-banner"
        >
          {t("FirmwareUpdate.banner.wallet40.title.default")}
        </Button>
      </Box>
      <UnsupportedUpdateDrawer
        isOpen={drawerProps.unsupportedUpdateDrawerOpened}
        onClose={drawerProps.closeUnsupportedUpdateDrawer}
        isUsbRequired={drawerProps.isUpdateSupportedButDeviceNotWired}
        productName={drawerProps.productName}
      />
    </>
  );
};

export default Wallet40PortfolioBanner;
