import React from "react";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTheme } from "styled-components/native";
import { renderAllowManager as AllowManager } from "../../components/DeviceAction/rendering";
import QueuedDrawer from "../../components/QueuedDrawer";

export type Props = {
  isOpen: boolean;
  onPress?: () => void;
  onClose?: () => void;
  device: Device;
};

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
      <Flex mb={260} pt={110}>
        <AllowManager
          t={t}
          wording={t(
            "syncOnboarding.softwareChecksSteps.allowManagerDrawer.wording",
          )}
          device={device}
          theme={theme}
        />
      </Flex>
    </QueuedDrawer>
  );
};

export default AllowManagerDrawer;
