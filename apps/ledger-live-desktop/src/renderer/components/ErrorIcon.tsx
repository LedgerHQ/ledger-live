import React from "react";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import Warning from "~/renderer/icons/TriangleWarning";
import CrossCircle from "~/renderer/icons/CrossCircle";
import InfoCircle from "~/renderer/icons/InfoCircle";
import Lock from "~/renderer/icons/LockCircle";
import {
  UserRefusedAllowManager,
  UserRefusedFirmwareUpdate,
  UserRefusedOnDevice,
  UserRefusedAddress,
  ManagerDeviceLockedError,
} from "@ledgerhq/errors";
import {
  SwapGenericAPIError,
  DeviceNotOnboarded,
  NoSuchAppOnProvider,
} from "@ledgerhq/live-common/errors";

export type ErrorIconProps = {
  error: unknown;
  size?: number;
};

const ErrorIcon = ({ error, size = 44 }: ErrorIconProps) => {
  if (!error) return null;

  if (error instanceof DeviceNotOnboarded) {
    return <InfoCircle size={size} />;
  }

  if (error instanceof UserRefusedFirmwareUpdate) {
    return <Warning size={size} />;
  }

  if (
    error instanceof UserRefusedAllowManager ||
    error instanceof UserRefusedOnDevice ||
    error instanceof UserRefusedAddress ||
    error instanceof SwapGenericAPIError ||
    error instanceof NoSuchAppOnProvider
  ) {
    return <CrossCircle size={size} />;
  }

  if (error instanceof ManagerDeviceLockedError) {
    return <Lock size={size} />;
  }

  return <ExclamationCircleThin size={size} />;
};

export default ErrorIcon;
