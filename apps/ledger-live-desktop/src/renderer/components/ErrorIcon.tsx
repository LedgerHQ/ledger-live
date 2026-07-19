import React from "react";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import CrossCircle from "~/renderer/icons/CrossCircle";
import InfoCircle from "~/renderer/icons/InfoCircle";
import Lock from "~/renderer/icons/LockCircle";
import { IconsLegacy } from "@ledgerhq/react-ui";

export type ErrorIconProps = {
  error: unknown;
  size?: number;
};

const ErrorIcon = ({ error, size = 44 }: ErrorIconProps) => {
  if (!error) return null;

  if (error?.name === "DeviceNotOnboarded") {
    return <InfoCircle size={size} />;
  }

  if (
    error?.name === "UserRefusedFirmwareUpdate" ||
    error?.name === "UserRefusedAllowManager" ||
    error?.name === "UserRefusedOnDevice" ||
    error?.name === "UserRefusedAddress" ||
    error?.name === "LanguageInstallRefusedOnDevice" ||
    error?.name === "ImageDoesNotExistOnDevice" ||
    error?.name === "ImageLoadRefusedOnDevice" ||
    error?.name === "UserRefusedDeviceNameChange"
  ) {
    return <IconsLegacy.InfoMedium size={size} color="primary.c80" />;
  }

  if (error?.name === "SwapGenericAPIError" || error?.name === "NoSuchAppOnProvider") {
    return <CrossCircle size={size} />;
  }

  if (error?.name === "ManagerDeviceLockedError") {
    return <Lock size={size} />;
  }

  return <ExclamationCircleThin size={size} />;
};

export default ErrorIcon;
