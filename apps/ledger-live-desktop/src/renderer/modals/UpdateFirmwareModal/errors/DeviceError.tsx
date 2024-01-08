import React, { useCallback, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { context } from "~/renderer/drawers/Provider";
import UpdateFirmwareError from ".";
import { LockedDeviceError, UserRefusedFirmwareUpdate } from "@ledgerhq/errors";
import {
  ImageCommitRefusedOnDevice,
  ImageLoadRefusedOnDevice,
  LanguageInstallRefusedOnDevice,
} from "@ledgerhq/live-common/errors";

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
  const history = useHistory();
  const { setDrawer } = useContext(context);
  const onCloseReload = useCallback(() => {
    onDrawerClose();

    if (error instanceof UserRefusedFirmwareUpdate && shouldReloadManagerOnCloseIfUpdateRefused) {
      history.push("/manager/reload");
      setDrawer();
    }
  }, [error, history, onDrawerClose, setDrawer, shouldReloadManagerOnCloseIfUpdateRefused]);

  const isUserRefusedFirmwareUpdate = error instanceof UserRefusedFirmwareUpdate;
  const isDeviceLockedError = error instanceof LockedDeviceError;
  const isRestoreStepRefusedOnDevice =
    error instanceof ImageLoadRefusedOnDevice ||
    (error as unknown) instanceof ImageCommitRefusedOnDevice ||
    (error as unknown) instanceof LanguageInstallRefusedOnDevice;
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
        withExportLogs={!isUserRefusedFirmwareUpdate && !isRestoreStepRefusedOnDevice}
      />
    </UpdateFirmwareError>
  );
};

export default DeviceCancel;
