import React from "react";
import { useTranslation } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ParamListBase, useNavigation } from "@react-navigation/native";
import QueuedDrawer from "~/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import { AutoRepair } from "~/components/DeviceAction/rendering";
import { StackNavigationProp } from "@react-navigation/stack";
import { Flex } from "@ledgerhq/native-ui";

export type Props = {
  isOpen: boolean;
  onDone: () => void;
  device: Device;
};

/**
 * Handles case where the device is in bootloader mode, probably because a firmware update went wrong
 */
const AutoRepairDrawer = ({ isOpen, onDone, device }: Props) => {
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} preventBackdropClick noCloseButton>
      <TrackScreen
        category="Repairing device in bootloader mode"
        type="drawer"
        refreshSource={false}
      />
      <Flex flexDirection="row">
        <AutoRepair device={device} onDone={onDone} t={t} navigation={navigation} />
      </Flex>
    </QueuedDrawer>
  );
};

export default AutoRepairDrawer;
