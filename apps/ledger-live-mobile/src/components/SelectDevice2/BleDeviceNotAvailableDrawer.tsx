import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "~/components/Button";
import QueuedDrawer from "~/components/QueuedDrawer";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ConnectYourDevice } from "../DeviceAction/rendering";
import { Flex, Alert, IconsLegacy } from "@ledgerhq/native-ui";
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
      <Flex paddingBottom={8}>
        <ConnectYourDevice device={device} fullScreen={false} />
      </Flex>
      {showHelp && (
        <Flex
          borderRadius={8}
          pb={16}
          backgroundColor="primary.c10"
          flexDirection="column"
          justifyContent="space-evenly"
          alignItems="center"
          alignSelf="stretch"
        >
          <Alert
            type="info"
            title={t("SelectDevice.bleDeviceNotAvailableDrawer.bannerHintTitle")}
          />
          <Flex
            pl={32}
            flexDirection="row"
            justifyContent="flex-end"
            alignItems="center"
            columnGap={16}
          >
            <Button
              type="main"
              size="small"
              onPress={handleRedirectToScan}
              title={t("SelectDevice.bleDeviceNotAvailableDrawer.scanSignersCta")}
            />
            <Button
              type="main"
              outline
              size="small"
              onPress={() => Linking.openURL(urls.errors.PeerRemovedPairing)}
              title={t("SelectDevice.bleDeviceNotAvailableDrawer.helpCenterCta")}
              Icon={IconsLegacy.ExternalLinkMedium}
            />
          </Flex>
        </Flex>
      )}
    </QueuedDrawer>
  );
}
