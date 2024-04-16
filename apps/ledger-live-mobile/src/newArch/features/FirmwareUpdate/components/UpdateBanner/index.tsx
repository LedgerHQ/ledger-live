import React, { memo } from "react";
import { Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Text, Flex, Icons } from "@ledgerhq/native-ui";
import { DownloadMedium, UsbMedium } from "@ledgerhq/native-ui/assets/icons";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";

import Button from "~/components/Button";
import QueuedDrawer from "~/components/QueuedDrawer";
import { UpdateStep } from "~/screens/FirmwareUpdate";
import { useUpdateBannerViewModel } from "./useUpdateBannerViewModel";
import type { ViewProps } from "./ViewProps";

export type FirmwareUpdateBannerProps = {
  onBackFromUpdate: (updateState: UpdateStep) => void;
};

const UpdateBanner = ({
  bannerVisible,
  lastConnectedDevice,
  version,
  onClickUpdate,
  unsupportedUpdateDrawerOpened,
  closeUnsupportedUpdateDrawer,
  isUpdateSupportedButDeviceNotWired,
}: ViewProps) => {
  const { t } = useTranslation();
  const productName = lastConnectedDevice
    ? getDeviceModel(lastConnectedDevice.modelId).productName
    : undefined;

  const deviceName = lastConnectedDevice?.deviceName;
  return bannerVisible ? (
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
            {lastConnectedDevice?.modelId === DeviceModelId.stax ? (
              <Icons.Stax color="primary.c80" size="M" />
            ) : lastConnectedDevice?.modelId === DeviceModelId.europa ? (
              <Icons.Europa color="primary.c80" size="M" />
            ) : (
              <Icons.Nano color="primary.c80" size="M" />
            )}
          </Flex>
          <Flex flexDirection="column" alignItems={"flex-start"} flexShrink={1}>
            <Text variant="h5" fontWeight="semiBold" pb={4}>
              {t("FirmwareUpdate.banner.title")}
            </Text>
            <Text variant="paragraph" fontWeight="medium" color="opacityDefault.c70">
              {deviceName
                ? t("FirmwareUpdate.banner.descriptionDeviceName", {
                    deviceName,
                    firmwareVersion: version,
                  })
                : t("FirmwareUpdate.banner.descriptionProductName", {
                    productName,
                    firmwareVersion: version,
                  })}
            </Text>
          </Flex>
        </Flex>
      </Pressable>

      <QueuedDrawer
        isRequestingToBeOpened={unsupportedUpdateDrawerOpened}
        onClose={closeUnsupportedUpdateDrawer}
        Icon={isUpdateSupportedButDeviceNotWired ? UsbMedium : DownloadMedium}
        title={
          isUpdateSupportedButDeviceNotWired
            ? t("FirmwareUpdate.drawerUpdate.pleaseConnectUsbTitle")
            : t("FirmwareUpdate.drawerUpdate.title")
        }
        description={
          isUpdateSupportedButDeviceNotWired
            ? t("FirmwareUpdate.drawerUpdate.pleaseConnectUsbDescription", {
                deviceName: productName,
              })
            : t("FirmwareUpdate.drawerUpdate.description")
        }
        noCloseButton
      >
        <Button
          testID="fw-update-drawer-unsupported-close-btn"
          type="primary"
          title={t("common.close")}
          onPress={closeUnsupportedUpdateDrawer}
        />
      </QueuedDrawer>
    </>
  ) : null;
};

export default memo((props: FirmwareUpdateBannerProps) => (
  <UpdateBanner {...useUpdateBannerViewModel(props)} />
));
