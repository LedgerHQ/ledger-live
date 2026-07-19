import React, { useCallback, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { context } from "~/renderer/drawers/Provider";
import UpdateFirmwareError from ".";

type Props = {
  error: Error;
  shouldReloadManagerOnCloseIfUpdateRefused: boolean;
  onDrawerClose: () => void;
  onRetry: (isRetry?: boolean) => void;
  onSkip: () => void;
};

const DeviceCancel = ({
  error,
  shouldReloadManagerOnCloseIfUpdateRefused,
  onDrawerClose,
  onRetry,
  onSkip,
}: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setDrawer } = useContext(context);
  const onCloseReload = useCallback(() => {
    onDrawerClose();

    if (error?.name === "UserRefusedFirmwareUpdate" && shouldReloadManagerOnCloseIfUpdateRefused) {
      navigate("/manager/reload");
      setDrawer();
    }
  }, [error, navigate, onDrawerClose, setDrawer, shouldReloadManagerOnCloseIfUpdateRefused]);

  const isUserRefusedFirmwareUpdate = error?.name === "UserRefusedFirmwareUpdate";
  const isDeviceLockedError = error?.name === "LockedDeviceError";
  const isRestoreStepRefusedOnDevice =
    error?.name === "ImageLoadRefusedOnDevice" ||
    error?.name === "ImageCommitRefusedOnDevice" ||
    error?.name === "LanguageInstallRefusedOnDevice";
  const isRetryableError =
    isUserRefusedFirmwareUpdate || isDeviceLockedError || isRestoreStepRefusedOnDevice;

  const cancelLabel = isRestoreStepRefusedOnDevice
    ? t("manager.firmware.skipRestore")
    : isDeviceLockedError || isUserRefusedFirmwareUpdate
      ? t("manager.firmware.cancelUpdate")
      : t("common.close");
  const continueLabel = isRestoreStepRefusedOnDevice
    ? t("common.retry")
    : t("manager.firmware.restartUpdate");

  return (
    <UpdateFirmwareError
      cancelLabel={cancelLabel}
      continueLabel={continueLabel}
      onCancel={isRestoreStepRefusedOnDevice ? onSkip : onCloseReload}
      onContinue={isRetryableError ? () => onRetry(isRestoreStepRefusedOnDevice) : undefined}
    >
      <ErrorDisplay
        error={error}
        warning={isUserRefusedFirmwareUpdate}
        withExportLogs={
          !isUserRefusedFirmwareUpdate && !isRestoreStepRefusedOnDevice && !isDeviceLockedError
        }
      />
    </UpdateFirmwareError>
  );
};

export default DeviceCancel;
