import React from "react";
import { Drawer, Flex, Text, Button, Link } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import { ExternalLinkMedium } from "@ledgerhq/react-ui/assets/icons";
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
            width="230px"
            height="288px"
            animation={getDeviceAnimation(
              lastKnownDeviceId,
              theme.theme as "light" | "dark",
              "plugAndPinCode",
            )}
          />
          <Text variant="h4" fontSize={24} fontWeight="semiBold">
            {t("syncOnboarding.manual.troubleshootingDrawer.title")}
          </Text>
          <Text variant="body" mt={8}>
            {t("syncOnboarding.manual.troubleshootingDrawer.description")}
          </Text>
        </Flex>
        <Flex flexDirection="column">
          <Button
            variant="main"
            Icon={ExternalLinkMedium}
            iconSize={18}
            onClick={() => history.push("/USBTroubleshooting")}
          >
            {t("syncOnboarding.manual.troubleshootingDrawer.fixButton")}
          </Button>
          <Link Icon={ExternalLinkMedium} mt={8} onClick={onClose}>
            {t("syncOnboarding.manual.troubleshootingDrawer.closeButton")}
          </Link>
        </Flex>
      </Flex>
    </Drawer>
  );
};

export default TroubleshootingDrawer;
