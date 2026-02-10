import React, { memo } from "react";
import { Pressable } from "react-native";
import { Flex as FlexIcon, Nano, Stax, Apex } from "@ledgerhq/lumen-ui-rnative/symbols";
import { DownloadMedium, UsbMedium } from "@ledgerhq/native-ui/assets/icons";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { Button as LumenButton, Box, Text as LumenText } from "@ledgerhq/lumen-ui-rnative";
import Button from "~/components/Button";
import QueuedDrawer from "~/components/QueuedDrawer";
import { UpdateStep } from "~/screens/FirmwareUpdate";
import { useUpdateBannerViewModel } from "./useUpdateBannerViewModel";
import type { ViewProps } from "./ViewProps";
import { Text, Flex, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";

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
  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      Icon={isUsbRequired ? UsbMedium : DownloadMedium}
      title={
        isUsbRequired
          ? t("FirmwareUpdate.drawerUpdate.pleaseConnectUsbTitle")
          : t("FirmwareUpdate.drawerUpdate.title")
      }
      description={
        isUsbRequired
          ? t("FirmwareUpdate.drawerUpdate.pleaseConnectUsbDescription", {
              deviceName: productName,
            })
          : t("FirmwareUpdate.drawerUpdate.description")
      }
      noCloseButton={noCloseButton}
    >
      <Button
        testID="fw-update-drawer-unsupported-close-btn"
        type="primary"
        title={t("common.close")}
        onPress={onClose}
      />
    </QueuedDrawer>
  );
};

type DrawerProps = Pick<
  ViewProps,
  | "unsupportedUpdateDrawerOpened"
  | "closeUnsupportedUpdateDrawer"
  | "isUpdateSupportedButDeviceNotWired"
> & {
  productName: string | undefined;
  noCloseButton?: boolean;
};

const Wallet40PortfolioBanner = ({
  deviceIcon,
  onClickUpdate,
  drawerProps,
}: {
  deviceIcon: ReturnType<typeof getDeviceIcon>;
  onClickUpdate: () => void;
  drawerProps: DrawerProps;
}) => {
  const { t } = useTranslation();
  return (
    <>
      <Box lx={{ alignItems: "center", paddingTop: "s16", gap: "s10" }}>
        <LumenButton
          appearance="transparent"
          size="sm"
          icon={deviceIcon}
          onPress={onClickUpdate}
          testID="fw-update-banner"
        >
          {t("FirmwareUpdate.banner.wallet40.title.default")}
        </LumenButton>
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

const Wallet40MyLedgerBanner = ({
  productName,
  version,
  onClickUpdate,
  drawerProps,
}: {
  productName: string | undefined;
  version: string;
  onClickUpdate: () => void;
  drawerProps: DrawerProps;
}) => {
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
          <LumenText typography="heading5SemiBold" lx={{ color: "black" }}>
            {t("FirmwareUpdate.banner.wallet40.title.manager")}
          </LumenText>
          <LumenText typography="body2" lx={{ color: "black" }}>
            {t("FirmwareUpdate.banner.wallet40.version", {
              productName,
              firmwareVersion: version,
            })}
          </LumenText>
        </Box>
        <Box>
          <LumenButton appearance="gray" size="sm" onPress={onClickUpdate}>
            {t("FirmwareUpdate.banner.wallet40.cta", {
              productName,
              firmwareVersion: version,
            })}
          </LumenButton>
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

const LegacyBanner = ({
  lastConnectedDevice,
  deviceName,
  productName,
  version,
  onClickUpdate,
  drawerProps,
}: {
  lastConnectedDevice: ViewProps["lastConnectedDevice"];
  deviceName: string | undefined;
  productName: string | undefined;
  version: string;
  onClickUpdate: () => void;
  drawerProps: DrawerProps;
}) => {
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
            <DeviceIcon deviceModelId={lastConnectedDevice?.modelId} />
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
  shouldDisplayWallet40MainNav,
  isInMyLedgerDeviceScreen,
}: ViewProps) => {
  if (!bannerVisible) return null;

  const productName = lastConnectedDevice
    ? getDeviceModel(lastConnectedDevice.modelId).productName
    : undefined;

  const drawerProps: DrawerProps = {
    unsupportedUpdateDrawerOpened,
    closeUnsupportedUpdateDrawer,
    isUpdateSupportedButDeviceNotWired,
    productName,
  };

  if (shouldDisplayWallet40MainNav && !isInMyLedgerDeviceScreen) {
    return (
      <Wallet40PortfolioBanner
        deviceIcon={getDeviceIcon(lastConnectedDevice?.modelId)}
        onClickUpdate={onClickUpdate}
        drawerProps={drawerProps}
      />
    );
  }

  if (shouldDisplayWallet40MainNav && isInMyLedgerDeviceScreen) {
    return (
      <Wallet40MyLedgerBanner
        productName={productName}
        version={version}
        onClickUpdate={onClickUpdate}
        drawerProps={drawerProps}
      />
    );
  }

  return (
    <LegacyBanner
      lastConnectedDevice={lastConnectedDevice}
      deviceName={lastConnectedDevice?.deviceName ?? undefined}
      productName={productName}
      version={version}
      onClickUpdate={onClickUpdate}
      drawerProps={drawerProps}
    />
  );
};

export default memo((props: FirmwareUpdateBannerProps) => (
  <UpdateBanner {...useUpdateBannerViewModel(props)} />
));
