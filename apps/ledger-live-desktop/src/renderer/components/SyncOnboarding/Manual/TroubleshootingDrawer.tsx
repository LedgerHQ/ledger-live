import React, { useCallback } from "react";
import { Drawer, Flex, Text, Button } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import { DeviceModelId } from "@ledgerhq/devices";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { track } from "~/renderer/analytics/segment";
import { analyticsFlowName } from "./shared";
import TrackPage from "~/renderer/analytics/TrackPage";

export type Props = {
  isOpen: boolean;
  onClose: () => void;
  lastKnownDeviceId: DeviceModelId;
};

/**
 * Drawer when the device has connection issues
 */
const TroubleshootingDrawer: React.FC<Props> = ({ isOpen, onClose, lastKnownDeviceId }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const theme = useTheme();

  const handleFixClicked = useCallback(() => {
    history.push("/USBTroubleshooting");
    track("button_clicked", {
      button: "fix it",
      page: "drawer troubleshoot USB connection",
      flow: analyticsFlowName,
    });
  }, [history]);

  return (
    <Drawer big isOpen={isOpen} onClose={onClose}>
      <TrackPage
        category="drawer troubleshoot USB connection"
        type="drawer"
        flow={analyticsFlowName}
        error="troubleshoot USB connection"
        refreshSource={false}
      />
      <Flex position="relative" flexDirection="column" height="100%" px={6}>
        <Flex flexDirection="column" flex={1}>
          <Animation
            animation={
              getDeviceAnimation(lastKnownDeviceId, theme.theme, "plugAndPinCode") as object
            }
          />
          <Text mt={5} variant="h4Inter" textAlign="center" fontSize={24} fontWeight="semiBold">
            {t("syncOnboarding.manual.troubleshootingDrawer.title")}
          </Text>
          <Text variant="large" textAlign="center" mt={6} color="neutral.c70">
            {t("syncOnboarding.manual.troubleshootingDrawer.description")}
          </Text>
        </Flex>
        <Flex flexDirection="column" px={16}>
          <Button variant="main" iconSize={18} onClick={handleFixClicked}>
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
