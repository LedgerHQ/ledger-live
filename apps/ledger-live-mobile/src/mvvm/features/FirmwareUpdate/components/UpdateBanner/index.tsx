import React, { memo, useEffect, useRef } from "react";
import { Pressable } from "react-native";
import { useTranslation } from "~/context/Locale";
import { Flex as FlexIcon, Nano, Stax, Apex } from "@ledgerhq/lumen-ui-rnative/symbols";
import { DownloadMedium, UsbMedium } from "@ledgerhq/native-ui/assets/icons";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { track } from "~/analytics";
import { Button as LumenButton, Box } from "@ledgerhq/lumen-ui-rnative";
import Button from "~/components/Button";
import QueuedDrawer from "~/components/QueuedDrawer";
import { UpdateStep } from "~/screens/FirmwareUpdate";
import { useUpdateBannerViewModel } from "./useUpdateBannerViewModel";
import type { ViewProps } from "./ViewProps";
import { Text, Flex, Icons } from "@ledgerhq/native-ui";
import { useWallet40Theme } from "LLM/hooks/useWallet40Theme";

function getDeviceIcon(modelId: DeviceModelId | undefined) {
  switch (modelId) {
    case DeviceModelId.stax:
      return Stax;
    case DeviceModelId.europa:
      return FlexIcon;
    case DeviceModelId.apex:
      return Apex;
    default:
      return Nano;
  }
}

const DeviceIcon = ({ deviceModelId }: { deviceModelId: DeviceModelId | undefined }) => {
  switch (deviceModelId) {
    case DeviceModelId.stax:
      return <Icons.Stax color="primary.c80" size="M" />;
    case DeviceModelId.europa:
      return <Icons.Flex color="primary.c80" size="M" />;
    case DeviceModelId.apex:
      return <Icons.Apex color="primary.c80" size="M" />;
    default:
      return <Icons.Nano color="primary.c80" size="M" />;
  }
};

export type FirmwareUpdateBannerProps = {
  onBackFromUpdate: (updateState: UpdateStep) => void;
  fullWidth?: boolean;
};

const UpdateBanner = ({
  bannerVisible,
  lastConnectedDevice,
  version,
  onClickUpdate,
  unsupportedUpdateDrawerOpened,
  closeUnsupportedUpdateDrawer,
  isUpdateSupportedButDeviceNotWired,
  fullWidth = false,
}: ViewProps) => {
  const { t } = useTranslation();
  const hasTrackedImpressionRef = useRef(false);
  const { isWallet40Enabled } = useWallet40Theme("mobile");

  useEffect(() => {
    if (!isWallet40Enabled) return;

    if (bannerVisible && !hasTrackedImpressionRef.current) {
      hasTrackedImpressionRef.current = true;
      track("banner_impression", { banner: "OS update", page: "portfolio" });
    }
  }, [bannerVisible, isWallet40Enabled]);

  const productName = lastConnectedDevice
    ? getDeviceModel(lastConnectedDevice.modelId).productName
    : undefined;

  const deviceName = lastConnectedDevice?.deviceName;
  const deviceIcon = getDeviceIcon(lastConnectedDevice?.modelId);

  if (isWallet40Enabled) {
    return bannerVisible ? (
      <>
        {fullWidth ? (
          <LumenButton
            appearance="transparent"
            size="sm"
            icon={deviceIcon}
            onPress={onClickUpdate}
            testID="fw-update-banner"
            isFull
          >
            {t("FirmwareUpdate.banner.title")}
          </LumenButton>
        ) : (
          <Box lx={{ alignItems: "center", paddingTop: "s16" }}>
            <LumenButton
              appearance="transparent"
              size="sm"
              icon={deviceIcon}
              onPress={onClickUpdate}
              testID="fw-update-banner"
            >
              {t("FirmwareUpdate.banner.title")}
            </LumenButton>
          </Box>
        )}

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
  }

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
            <DeviceIcon deviceModelId={lastConnectedDevice?.modelId} />
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
