import React from "react";
import { useTranslation } from "react-i18next";
import Button from "~/components/Button";
import QueuedDrawer from "~/components/QueuedDrawer";
import { DisplayedDevice } from "./DisplayedDevice";
import { useCallback } from "react";
import { renderConnectYourDevice } from "../DeviceAction/rendering";
import { useTheme } from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";

interface Props {
  isOpen: boolean;
  device: DisplayedDevice;
  onClose: () => void;
  redirectToScan: () => void;
}

export default function BleDeviceNotAvailableDrawer({
  isOpen,
  device,
  onClose,
  redirectToScan,
}: Props) {
  const { t } = useTranslation();
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleRedirectToScan = useCallback(() => {
    onClose();
    redirectToScan();
  }, [onClose, redirectToScan]);

  const theme = useTheme();

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen && Boolean(device)} onClose={onClose}>
      <Flex>
        {renderConnectYourDevice({
          t,
          device,
          theme: theme.colors.type as "light" | "dark",
          fullScreen: false,
        })}
      </Flex>
      <Button
        type="main"
        size="large"
        mt={8}
        mb={6}
        onPress={handleRedirectToScan}
        title={t("SelectDevice.bleDeviceNotAvailableDrawer.scanSignersCta")}
      />
      <Button size="large" onPress={handleClose} title={t("common.cancel")} />
    </QueuedDrawer>
  );
}
