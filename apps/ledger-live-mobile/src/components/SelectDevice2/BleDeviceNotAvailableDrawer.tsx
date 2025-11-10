import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "~/components/Button";
import QueuedDrawer from "~/components/QueuedDrawer";
import { useCallback } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { renderConnectYourDevice } from "../DeviceAction/rendering";
import { useTheme } from "styled-components/native";
import { Flex, Alert, IconsLegacy } from "@ledgerhq/native-ui";
import { Linking } from "react-native";
import { urls } from "~/utils/urls";

interface Props {
  isOpen: boolean;
  device: Device;
  onClose: () => void;
  redirectToScan: () => void;
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

  const theme = useTheme();

  useEffect(() => {
    setTimeout(() => {
      setShowHelp(true);
    }, SHOW_HELP_TIMEOUT);
  }, [setShowHelp]);

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen && Boolean(device)} onClose={onClose}>
      <Flex paddingBottom={8}>
        {renderConnectYourDevice({
          t,
          device,
          theme: theme.colors.type as "light" | "dark",
          fullScreen: false,
        })}
      </Flex>
      {showHelp && (
        <>
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
        </>
      )}
    </QueuedDrawer>
  );
}
