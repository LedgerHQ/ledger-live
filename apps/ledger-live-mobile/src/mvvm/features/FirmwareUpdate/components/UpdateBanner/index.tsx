import React, { memo } from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import { UpdateStep } from "~/screens/FirmwareUpdate";
import { useUpdateBannerViewModel } from "./useUpdateBannerViewModel";
import type { ViewProps, DrawerProps } from "./ViewProps";
import { getDeviceSymbol } from "LLM/utils/getDeviceIcon";
import Wallet40PortfolioBanner from "./Wallet40PortfolioBanner";
import Wallet40MyLedgerBanner from "./Wallet40MyLedgerBanner";
import LegacyBanner from "./LegacyBanner";

export type FirmwareUpdateBannerProps = {
  onBackFromUpdate: (updateState: UpdateStep) => void;
};

const UpdateBannerView = ({
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
        deviceIcon={getDeviceSymbol(lastConnectedDevice)}
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
  <UpdateBannerView {...useUpdateBannerViewModel(props)} />
));
