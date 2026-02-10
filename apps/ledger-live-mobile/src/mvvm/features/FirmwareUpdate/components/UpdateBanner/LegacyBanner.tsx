import React from "react";
import { Pressable } from "react-native";
import { Text, Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import { getDeviceIcon } from "LLM/utils/getDeviceIcon";
import type { ViewProps, DrawerProps } from "./ViewProps";
import UnsupportedUpdateDrawer from "./UnsupportedUpdateDrawer";

type LegacyBannerProps = {
  lastConnectedDevice: ViewProps["lastConnectedDevice"];
  deviceName: string | undefined;
  productName: string | undefined;
  version: string;
  onClickUpdate: () => void;
  drawerProps: DrawerProps;
};

const LegacyBanner = ({
  lastConnectedDevice,
  deviceName,
  productName,
  version,
  onClickUpdate,
  drawerProps,
}: LegacyBannerProps) => {
  const { t } = useTranslation();
  const description = deviceName
    ? t("FirmwareUpdate.banner.descriptionDeviceName", { deviceName, firmwareVersion: version })
    : t("FirmwareUpdate.banner.descriptionProductName", { productName, firmwareVersion: version });

  return (
    <>
      <Pressable onPress={onClickUpdate} testID="fw-update-banner">
        <Flex
          flexDirection="row"
          alignItems="flex-start"
          backgroundColor="opacityDefault.c05"
          borderRadius={12}
          p={7}
          pl={5}
        >
          <Flex flexDirection="row" alignItems="center" mb={5} mr={4}>
            {getDeviceIcon(lastConnectedDevice)}
          </Flex>
          <Flex flexDirection="column" alignItems={"flex-start"} flexShrink={1}>
            <Text variant="h5" fontWeight="semiBold" pb={4}>
              {t("FirmwareUpdate.banner.title")}
            </Text>
            <Text variant="paragraph" fontWeight="medium" color="opacityDefault.c70">
              {description}
            </Text>
          </Flex>
        </Flex>
      </Pressable>
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

export default LegacyBanner;
