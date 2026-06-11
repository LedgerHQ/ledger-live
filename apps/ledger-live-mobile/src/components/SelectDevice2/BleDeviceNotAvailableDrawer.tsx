import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "~/context/Locale";
import QueuedDrawer from "~/components/QueuedDrawer";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ConnectYourDevice } from "../DeviceAction/rendering";
import { Banner, Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
import { Linking } from "react-native";
import { urls } from "~/utils/urls";
import { TrackScreen } from "~/analytics";

interface Props {
  readonly isOpen: boolean;
  readonly device: Device;
  readonly onClose: () => void;
  readonly redirectToScan: () => void;
}

const SHOW_HELP_TIMEOUT = 8000;

export default function BleDeviceNotAvailableDrawer({
  isOpen,
  device,
  onClose,
  redirectToScan,
}: Props) {
  const [showHelp, setShowHelp] = useState(false);

  const { t } = useTranslation();

  const handleRedirectToScan = useCallback(() => {
    onClose();
    redirectToScan();
  }, [onClose, redirectToScan]);

  const handleOpenHelpCenter = useCallback(() => {
    Linking.openURL(urls.errors.PeerRemovedPairing);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowHelp(true);
    }, SHOW_HELP_TIMEOUT);

    return () => clearTimeout(timeout);
  }, [setShowHelp]);

  const trackingProps = {
    modelId: device.modelId,
    wired: device.wired,
  };

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen && Boolean(device)} onClose={onClose}>
      <TrackScreen name="Drawer: Power on and unlock" {...trackingProps} />
      <Box lx={{ paddingBottom: "s32" }}>
        <ConnectYourDevice device={device} fullScreen={false} />
      </Box>
      {showHelp && (
        <Banner
          appearance="info"
          title={t("SelectDevice.bleDeviceNotAvailableDrawer.bannerHintTitle")}
          primaryAction={
            <Button
              appearance="gray"
              size="sm"
              onPress={handleRedirectToScan}
              lx={{ flexShrink: 1 }}
            >
              {t("SelectDevice.bleDeviceNotAvailableDrawer.scanSignersCta")}
            </Button>
          }
          secondaryAction={
            <Button
              appearance="no-background"
              size="sm"
              icon={ExternalLink}
              onPress={handleOpenHelpCenter}
              lx={{ flexShrink: 1 }}
            >
              {t("SelectDevice.bleDeviceNotAvailableDrawer.helpCenterCta")}
            </Button>
          }
        />
      )}
    </QueuedDrawer>
  );
}
