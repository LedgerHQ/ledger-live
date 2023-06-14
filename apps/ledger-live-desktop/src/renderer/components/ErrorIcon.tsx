import React from "react";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import CrossCircle from "~/renderer/icons/CrossCircle";
import InfoCircle from "~/renderer/icons/InfoCircle";
import Lock from "~/renderer/icons/LockCircle";
import {
  UserRefusedAllowManager,
  UserRefusedFirmwareUpdate,
  UserRefusedOnDevice,
  UserRefusedAddress,
  ManagerDeviceLockedError,
  UserRefusedDeviceNameChange,
} from "@ledgerhq/errors";
import {
  SwapGenericAPIError,
  DeviceNotOnboarded,
  NoSuchAppOnProvider,
  LanguageInstallRefusedOnDevice,
  ImageDoesNotExistOnDevice,
} from "@ledgerhq/live-common/errors";
import { Icons } from "@ledgerhq/react-ui";

export type ErrorIconProps = {
  error: unknown;
  size?: number;
};

const ErrorIcon = ({ error, size = 44 }: ErrorIconProps) => {
  if (!error) return null;

  if (error instanceof DeviceNotOnboarded) {
    return <InfoCircle size={size} />;
  }

  if (
    error instanceof UserRefusedFirmwareUpdate ||
    error instanceof UserRefusedAllowManager ||
    error instanceof UserRefusedOnDevice ||
    error instanceof UserRefusedAddress ||
    error instanceof LanguageInstallRefusedOnDevice ||
    error instanceof ImageDoesNotExistOnDevice ||
    error instanceof UserRefusedDeviceNameChange
  ) {
    return <Icons.InfoMedium size={size} />;
  }

  if (error instanceof SwapGenericAPIError || error instanceof NoSuchAppOnProvider) {
    return <CrossCircle size={size} />;
  }

  if (error instanceof ManagerDeviceLockedError) {
    return <Lock size={size} />;
  }

  return <ExclamationCircleThin size={size} />;
};

export default ErrorIcon;
