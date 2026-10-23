import React, { memo } from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import { useFeature } from "@features/platform-feature-flags";
import { UpdateStep } from "~/screens/FirmwareUpdate";
import { OsUpdateBanner } from "LLM/features/OsUpdate/components/OsUpdateBanner";
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
  isInMyLedgerDeviceScreen,
  debugBannerMode,
}: ViewProps) => {
  if (!bannerVisible) return null;

  const productName = lastConnectedDevice
    ? getDeviceModel(lastConnectedDevice.modelId).productName
    : // Placeholder name for the debug-forced banner.
      debugBannerMode !== "off"
      ? "Speculos"
      : undefined;

  const drawerProps: DrawerProps = {
    unsupportedUpdateDrawerOpened,
    closeUnsupportedUpdateDrawer,
    isUpdateSupportedButDeviceNotWired,
    productName,
  };

  // Debug override: force a specific variant.
  if (debugBannerMode === "compact") {
    return (
      <Wallet40PortfolioBanner
        deviceIcon={getDeviceSymbol(lastConnectedDevice)}
        onClickUpdate={onClickUpdate}
        drawerProps={drawerProps}
      />
    );
  }

  if (debugBannerMode === "card") {
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
  }

  if (!isInMyLedgerDeviceScreen) {
    return (
      <Wallet40PortfolioBanner
        deviceIcon={getDeviceSymbol(lastConnectedDevice)}
        onClickUpdate={onClickUpdate}
        drawerProps={drawerProps}
      />
    );
  }

  if (isInMyLedgerDeviceScreen) {
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

const FirmwareUpdateBanner = memo((props: FirmwareUpdateBannerProps) => (
  <UpdateBannerView {...useUpdateBannerViewModel(props)} />
));

function UpdateBanner(props: Readonly<FirmwareUpdateBannerProps>) {
  const isOsUpdatesEnabled = useFeature("ldmkOsUpdates")?.enabled ?? false;
  if (isOsUpdatesEnabled) return <OsUpdateBanner />;
  return <FirmwareUpdateBanner {...props} />;
}

export default memo(UpdateBanner);
