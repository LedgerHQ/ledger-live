import React from "react";
import { Drawer, Flex, Text, Button } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import { DeviceModelId } from "@ledgerhq/devices";

import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";

export type Props = {
  isOpen: boolean;
  onClose: () => void;
  lastKnownDeviceId: DeviceModelId;
};

const TroubleshootingDrawer = ({ isOpen, onClose, lastKnownDeviceId }: Props) => {
  const { t } = useTranslation();
  const history = useHistory();
  const theme = useTheme();

  return (
    <Drawer big isOpen={isOpen} onClose={onClose}>
      <Flex position="relative" flexDirection="column" height="100%" px={6}>
        <Flex flexDirection="column" flex={1}>
          <Animation
            height="300px"
            animation={getDeviceAnimation(lastKnownDeviceId, theme.theme, "plugAndPinCode")}
          />
          <Text variant="h4Inter" textAlign="center" fontSize={24} fontWeight="semiBold">
            {t("syncOnboarding.manual.troubleshootingDrawer.title")}
          </Text>
          <Text variant="large" textAlign="center" mt={6} color="neutral.c70">
            {t("syncOnboarding.manual.troubleshootingDrawer.description")}
          </Text>
        </Flex>
        <Flex flexDirection="column" px={16}>
          <Button variant="main" iconSize={18} onClick={() => history.push("/USBTroubleshooting")}>
            {t("syncOnboarding.manual.troubleshootingDrawer.fixButton")}
          </Button>
          <Button mt={6} onClick={onClose}>
            {t("syncOnboarding.manual.troubleshootingDrawer.closeButton")}
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
};

export default TroubleshootingDrawer;
