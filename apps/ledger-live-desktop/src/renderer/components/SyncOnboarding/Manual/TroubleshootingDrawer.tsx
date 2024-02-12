import React, { useCallback } from "react";
import { Flex, Text, Button, Link } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import { DeviceModelId } from "@ledgerhq/devices";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { track } from "~/renderer/analytics/segment";
import { analyticsFlowName } from "./shared";
import TrackPage from "~/renderer/analytics/TrackPage";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

export type Props = {
  onClose: () => void;
  lastKnownDeviceId: DeviceModelId;
};

/**
 * Drawer when the device has connection issues
 */
const TroubleshootingDrawer: React.FC<Props> = ({ onClose, lastKnownDeviceId }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const theme = useTheme();

  const handleFixClicked = useCallback(() => {
    history.replace("/USBTroubleshooting");
    track("button_clicked2", {
      button: "fix it",
      page: "drawer troubleshoot USB connection",
      flow: analyticsFlowName,
    });
  }, [history]);

  return (
    <>
      <TrackPage
        category="drawer troubleshoot USB connection"
        type="drawer"
        flow={analyticsFlowName}
        error="troubleshoot USB connection"
        refreshSource={false}
      />
      <Flex flexDirection="column" height="100%" px={14}>
        <Flex flexDirection="column" flex={1} justifyContent={"center"}>
          <Animation
            animation={
              getDeviceAnimation(lastKnownDeviceId, theme.theme, "plugAndPinCode") as object
            }
          />
          <Text mt={12} variant="h5Inter" textAlign="center" fontWeight="semiBold">
            {t("syncOnboarding.manual.troubleshootingDrawer.title")}
          </Text>
          <Text variant="body" textAlign="center" mt={3} color="neutral.c70">
            {t("syncOnboarding.manual.troubleshootingDrawer.description")}
          </Text>
        </Flex>
        <Flex flexDirection="column" px={16} pb={9}>
          <Button variant="main" onClick={handleFixClicked}>
            {t("syncOnboarding.manual.troubleshootingDrawer.fixButton")}
          </Button>
          <Link mt={6} onClick={onClose}>
            {t("syncOnboarding.manual.troubleshootingDrawer.closeButton")}
          </Link>
        </Flex>
      </Flex>
    </>
  );
};

export default withV3StyleProvider(TroubleshootingDrawer);
