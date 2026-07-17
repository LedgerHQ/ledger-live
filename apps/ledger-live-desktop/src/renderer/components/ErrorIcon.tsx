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

  if ((error as Error).name === "DeviceNotOnboarded") {
    return <InfoCircle size={size} />;
  }

  if (
    (error as Error).name === "UserRefusedFirmwareUpdate" ||
    (error as Error).name === "UserRefusedAllowManager" ||
    (error as Error).name === "UserRefusedOnDevice" ||
    (error as Error).name === "UserRefusedAddress" ||
    (error as Error).name === "LanguageInstallRefusedOnDevice" ||
    (error as Error).name === "ImageDoesNotExistOnDevice" ||
    (error as Error).name === "ImageLoadRefusedOnDevice" ||
    (error as Error).name === "UserRefusedDeviceNameChange"
  ) {
    return <IconsLegacy.InfoMedium size={size} color="primary.c80" />;
  }

  if (
    (error as Error).name === "SwapGenericAPIError" ||
    (error as Error).name === "NoSuchAppOnProvider"
  ) {
    return <CrossCircle size={size} />;
  }

  if ((error as Error).name === "ManagerDeviceLockedError") {
    return <Lock size={size} />;
  }

  return <ExclamationCircleThin size={size} />;
};

export default ErrorIcon;
