import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTheme } from "styled-components/native";
import Animation from "~/components/Animation";
import QueuedDrawer from "~/components/QueuedDrawer";
import { getDeviceAnimation, getDeviceAnimationStyles } from "~/helpers/getDeviceAnimation";

export type Props = {
  /**
   * State to trigger the opening/closing of the drawer
   */
  isOpen: boolean;

  /**
   * Callback when the drawer is closed
   *
   * As the drawer has no close button (`noCloseButton`), the drawer is closed only when `isOpen === false`
   */
  onClose?: () => void;

  /**
   * A `Device` object
   */
  device: Device;
};

/**
 * Drawer displayed when a secure channel is needed during the early security check (probably genuine check)
 */
const AllowManagerDrawer = ({ isOpen, device, onClose }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const theme = colors.type as "dark" | "light";

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      preventBackdropClick
      noCloseButton
    >
      <Flex mt={8} alignItems="center" justifyContent="center">
        <Text variant="h4" textAlign="center">
          {t("earlySecurityCheck.allowManagerDrawer.title")}
        </Text>
        <Flex alignSelf="stretch" alignItems="center" justifyContent="center">
          <Animation
            source={getDeviceAnimation({ modelId: device.modelId, key: "allowManager", theme })}
            style={getDeviceAnimationStyles(device.modelId, { height: 200 })}
          />
        </Flex>
      </Flex>
    </QueuedDrawer>
  );
};

export default AllowManagerDrawer;
