import React from "react";
import {
  UserRefusedFirmwareUpdate,
  ManagerDeviceLockedError,
  LockedDeviceError,
  UserRefusedDeviceNameChange,
} from "@ledgerhq/errors";

import {
  BluetoothNotSupportedError,
  DeviceNotOnboarded,
  ImageCommitRefusedOnDevice,
  ImageLoadRefusedOnDevice,
} from "@ledgerhq/live-common/errors";
import { useTheme } from "styled-components/native";
import { Icons, Flex } from "@ledgerhq/native-ui";

export type ErrorIconProps = {
  error: Error;
  size?: number;
};

const ErrorIcon = ({ error, size = 30 }: ErrorIconProps) => {
  const { space } = useTheme();

  let Icon;
  let iconColor = "error.c60";

  switch (true) {
    case error instanceof ImageLoadRefusedOnDevice:
    case error instanceof ImageCommitRefusedOnDevice:
      Icon = Icons.CircledAlertMedium;
      iconColor = "warning.c100";
      break;
    case error instanceof LockedDeviceError:
      Icon = Icons.LockAltMedium;
      iconColor = "neutral.c100";
      break;
    case error instanceof BluetoothNotSupportedError:
      Icon = Icons.UsbMedium;
      iconColor = "neutral.c100";
      break;
    case error instanceof UserRefusedDeviceNameChange:
      Icon = Icons.WarningSolidMedium;
      iconColor = "warning.c80";
      break;
    case error instanceof DeviceNotOnboarded:
      Icon = Icons.InfoAltFillMedium;
      break;
    case error instanceof UserRefusedFirmwareUpdate:
      Icon = Icons.WarningMedium;
      break;
    case error instanceof ManagerDeviceLockedError:
      Icon = Icons.LockAltMedium;
      iconColor = "warning.c80";
      break;
    default:
      Icon = Icons.CloseMedium;
      break;
  }

  return (
    <Flex
      backgroundColor={"neutral.c100a005"}
      height={space[11]}
      width={space[11]}
      borderRadius={999}
      justifyContent="center"
      alignItems="center"
    >
      <Icon size={size} color={iconColor} />
    </Flex>
  );
};

export default ErrorIcon;
