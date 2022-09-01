import React, { useCallback } from "react";
import { BottomDrawer, Button, Link, Text } from "@ledgerhq/native-ui";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

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
    // TODO: add logic when user press "Support" button
  }, []);

  return (
    <BottomDrawer
      onClose={onClose}
      isOpen={isOpen}
      preventBackdropClick
      noCloseButton
    >
      <Text variant="h4" fontWeight="semiBold" mb={4} mt={8}>
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
    </BottomDrawer>
  );
};

export default DesyncDrawer;
