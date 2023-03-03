import React, { useCallback } from "react";
import { Linking } from "react-native";
import { Button, Link, Text } from "@ledgerhq/native-ui";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { urls } from "../../config/urls";
import QueuedDrawer from "../../components/QueuedDrawer";
import { TrackScreen, track } from "../../analytics";

export type Props = {
  isOpen: boolean;
  onClose?: () => void;
  onRetry: () => void;
  device: Device;
};

const DesyncDrawer = ({ isOpen, onClose, onRetry, device }: Props) => {
  const { t } = useTranslation();
  const productName =
    getDeviceModel(device.modelId).productName || device.modelId;

  const handleSupportPress = useCallback(() => {
    track("button_clicked", {
      button: "Get help",
      drawer: "Could not connect to Stax",
    });
    Linking.openURL(urls.errors.PairingFailed);
  }, []);

  return (
    <QueuedDrawer
      onClose={onClose}
      isRequestingToBeOpened={isOpen}
      preventBackdropClick
      noCloseButton
    >
      <TrackScreen
        category="Could not connect to Stax"
        type="drawer"
        refreshSource={false}
      />
      <Text variant="h4" fontWeight="semiBold" mb={4}>
        {t("syncOnboarding.desyncDrawer.title", { productName })}
      </Text>
      <Text variant="bodyLineHeight" mb={8} color="neutral.c80">
        {t("syncOnboarding.desyncDrawer.description", { productName })}
      </Text>
      <Button type="main" outline mb={6} onPress={onRetry}>
        {t("syncOnboarding.desyncDrawer.retryCta")}
      </Button>
      <Link Icon={ExternalLinkMedium} onPress={handleSupportPress}>
        {t("syncOnboarding.desyncDrawer.helpCta")}
      </Link>
    </QueuedDrawer>
  );
};

export default DesyncDrawer;
