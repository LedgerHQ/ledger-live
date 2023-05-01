import React from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { DeviceModelId } from "@ledgerhq/types-devices";

import RestoreIllustrations from "./RestoreIllustrations";

type Props = {
  onConfirm: () => void;
  onReject: () => void;
  deviceName?: string;
  deviceModelId?: DeviceModelId;
  lastSeenDeviceModelId?: DeviceModelId;
};

const Restore = ({
  onConfirm,
  onReject,
  deviceName,
  deviceModelId,
  lastSeenDeviceModelId,
}: Props) => {
  return (
    <Flex>
      <Flex alignItems="center" mb={7} mt={3}>
        <RestoreIllustrations
          lastSeenDeviceModelId={lastSeenDeviceModelId}
          deviceModelId={deviceModelId}
        />
      </Flex>
      <Text variant="h5" fontWeight="bold" textAlign="center">
        {deviceName ? (
          <Trans
            i18nKey="installSetOfApps.restore.title"
            values={{ deviceName }}
          />
        ) : (
          <Trans i18nKey="installSetOfApps.restore.titleNoDeviceName" />
        )}
      </Text>
      <Button mb={3} mt={6} size="small" type="main" onPress={onConfirm}>
        <Trans i18nKey="installSetOfApps.restore.installCTA" />
      </Button>
      <Button size="small" onPress={onReject}>
        <Trans i18nKey="installSetOfApps.restore.skipCTA" />
      </Button>
    </Flex>
  );
};

export default Restore;
