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
  const errorName = (error as { name?: string })?.name;

  if (errorName === "DeviceNotOnboarded") {
    return <InfoCircle size={size} />;
  }

  if (
    errorName === "UserRefusedFirmwareUpdate" ||
    errorName === "UserRefusedAllowManager" ||
    errorName === "UserRefusedOnDevice" ||
    errorName === "UserRefusedAddress" ||
    errorName === "LanguageInstallRefusedOnDevice" ||
    errorName === "ImageDoesNotExistOnDevice" ||
    errorName === "ImageLoadRefusedOnDevice" ||
    errorName === "UserRefusedDeviceNameChange"
  ) {
    return <IconsLegacy.InfoMedium size={size} color="primary.c80" />;
  }

  if (errorName === "SwapGenericAPIError" || errorName === "NoSuchAppOnProvider") {
    return <CrossCircle size={size} />;
  }

  if (errorName === "ManagerDeviceLocked") {
    return <Lock size={size} />;
  }

  return <ExclamationCircleThin size={size} />;
};

export default ErrorIcon;
