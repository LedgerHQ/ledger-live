import { log } from "@ledgerhq/logs";
import staxLoadImage from "@ledgerhq/live-common/hw/staxLoadImage";
import staxFetchImage from "@ledgerhq/live-common/hw/staxFetchImage";
import installLanguage from "@ledgerhq/live-common/hw/installLanguage";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import connectManager from "@ledgerhq/live-common/hw/connectManager";
import { createAction as createStaxLoadImageAction } from "@ledgerhq/live-common/hw/actions/staxLoadImage";
import { createAction as createStaxFetchImageAction } from "@ledgerhq/live-common/hw/actions/staxFetchImage";
import { createAction as createInstallLanguageAction } from "@ledgerhq/live-common/hw/actions/installLanguage";
import { createAction as createConnectAppAction } from "@ledgerhq/live-common/hw/actions/app";
import { createAction as createConnectManagerAction } from "@ledgerhq/live-common/hw/actions/manager";
import { useUpdateFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useUpdateFirmware";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import {
  UpdateFirmwareActionState,
  updateFirmwareActionArgs,
} from "@ledgerhq/live-common/deviceSDK/actions/updateFirmware";
import { Observable } from "rxjs";
import { useCallback, useMemo, useEffect, useState } from "react";
import { DeviceInfo, idsToLanguage, languageIds } from "@ledgerhq/types-live";
import { LedgerErrorConstructor } from "@ledgerhq/errors/lib/helpers";
import {
  CantOpenDevice,
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
  LockedDeviceError,
  UserRefusedAllowManager,
  WebsocketConnectionError,
  WebsocketConnectionFailed,
} from "@ledgerhq/errors";
import {
  ConnectManagerTimeout,
  ImageCommitRefusedOnDevice,
  ImageLoadRefusedOnDevice,
  LanguageInstallRefusedOnDevice,
} from "@ledgerhq/live-common/errors";

export const reconnectDeviceErrors: LedgerErrorConstructor<{
  [key: string]: unknown;
}>[] = [
  CantOpenDevice,
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
  LockedDeviceError,
  ConnectManagerTimeout,
];

export const retriableErrors: LedgerErrorConstructor<{
  [key: string]: unknown;
}>[] = [
  ...reconnectDeviceErrors,
  WebsocketConnectionError,
  UserRefusedAllowManager,
  LanguageInstallRefusedOnDevice,
  ImageCommitRefusedOnDevice,
  ImageLoadRefusedOnDevice,
  WebsocketConnectionFailed,
];

export type FirmwareUpdateParams = {
  device: Device;
  deviceInfo: DeviceInfo;
  updateFirmwareAction?: (args: updateFirmwareActionArgs) => Observable<UpdateFirmwareActionState>;
};

export type UpdateStep =
  | "start"
  | "appsBackup"
  | "imageBackup"
  | "firmwareUpdate"
  | "languageRestore"
  | "imageRestore"
  | "appsRestore"
  | "completed";

const installLanguageAction = createInstallLanguageAction(installLanguage);
const staxLoadImageAction = createStaxLoadImageAction(staxLoadImage);
const staxFetchImageAction = createStaxFetchImageAction(staxFetchImage);
const connectManagerAction = createConnectManagerAction(connectManager);
const connectAppAction = createConnectAppAction(connectApp);

export const useUpdateFirmwareAndRestoreSettings = ({
  updateFirmwareAction,
  device,
  deviceInfo,
}: FirmwareUpdateParams) => {
  const [updateStep, setUpdateStep] = useState<UpdateStep>("start");
  const [installedApps, setInstalledApps] = useState<string[]>([]);

  // device action hooks only get triggered when they have a device passed to them
  // so in order to control the chaining of actions we use a step state and only
  // pass a device down the hook when we're at the correct step
  const connectManagerRequest = useMemo(
    () => ({ cancelExecution: updateStep !== "appsBackup" }),
    [updateStep],
  );
  const connectManagerState = connectManagerAction.useHook(
    updateStep === "appsBackup" ? device : null,
    connectManagerRequest,
  );

  const staxFetchImageRequest = useMemo(
    () => ({
      // In the LLM fwm update flow, the error thrown because there is no image is caught and part of the normal flow
      // So we want it to throw the error.
      allowedEmpty: false,
    }),
    [],
  );
  const staxFetchImageState = staxFetchImageAction.useHook(
    updateStep === "imageBackup" ? device : null,
    staxFetchImageRequest,
  );

  const { triggerUpdate, updateState: updateActionState } = useUpdateFirmware({
    deviceId: device?.deviceId ?? "",
    updateFirmwareAction,
  });

  const installLanguageRequest = useMemo(
    () => ({ language: idsToLanguage[deviceInfo.languageId ?? 0] }),
    [deviceInfo.languageId],
  );
  const installLanguageState = installLanguageAction.useHook(
    updateStep === "languageRestore" ? device : null,
    installLanguageRequest,
  );

  const staxLoadImageRequest = useMemo(
    () => ({
      hexImage: staxFetchImageState.hexImage ?? "",
      padImage: false,
    }),
    [staxFetchImageState.hexImage],
  );
  const staxLoadImageState = staxLoadImageAction.useHook(
    updateStep === "imageRestore" && staxFetchImageState.hexImage ? device : null,
    staxLoadImageRequest,
  );

  const restoreAppsRequest = useMemo(
    () => ({
      dependencies: installedApps.map(appName => ({ appName })),
      appName: "BOLOS",
      withInlineInstallProgress: true,
      allowPartialDependencies: true,
    }),
    [installedApps],
  );

  const restoreAppsState = connectAppAction.useHook(
    updateStep === "appsRestore" ? device : null,
    restoreAppsRequest,
  );

  const proceedToFirmwareUpdate = useCallback(() => {
    setUpdateStep("firmwareUpdate");
  }, []);

  const proceedToAppsBackup = useCallback(() => {
    setUpdateStep("appsBackup");
  }, []);

  const proceedToImageBackup = useCallback(() => {
    if (device.modelId === DeviceModelId.stax) {
      setUpdateStep("imageBackup");
    } else {
      proceedToFirmwareUpdate();
    }
  }, [device.modelId, proceedToFirmwareUpdate]);

  const proceedToUpdateCompleted = useCallback(() => {
    setUpdateStep("completed");
  }, []);

  const proceedToAppsRestore = useCallback(() => {
    if (installedApps.length > 0) {
      setUpdateStep("appsRestore");
    } else {
      proceedToUpdateCompleted();
    }
  }, [proceedToUpdateCompleted, installedApps.length]);

  const proceedToImageRestore = useCallback(() => {
    if (staxFetchImageState.hexImage) {
      setUpdateStep("imageRestore");
    } else {
      proceedToAppsRestore();
    }
  }, [proceedToAppsRestore, staxFetchImageState.hexImage]);

  const proceedToLanguageRestore = useCallback(() => {
    if (deviceInfo.languageId !== undefined && deviceInfo.languageId !== languageIds.english) {
      setUpdateStep("languageRestore");
    } else {
      proceedToImageRestore();
    }
  }, [proceedToImageRestore, deviceInfo.languageId]);

  // this hook controls the chaining of device actions by updating the current step
  // when needed. It basically implements a state macgine
  useEffect(() => {
    let unrecoverableError;

    switch (updateStep) {
      case "start":
        proceedToAppsBackup();
        break;
      case "appsBackup":
        unrecoverableError =
          connectManagerState.error &&
          !retriableErrors.some(err => connectManagerState.error instanceof err);
        if (connectManagerState.result || unrecoverableError) {
          if (connectManagerState.error) {
            log("FirmwareUpdate", "error while backing up device apps", connectManagerState.error);
          }
          if (connectManagerState.result) {
            const installedAppsNames = connectManagerState.result.installed.map(({ name }) => name);
            setInstalledApps(installedAppsNames);
          }
          proceedToImageBackup();
        }
        break;
      case "imageBackup":
        unrecoverableError =
          staxFetchImageState.error &&
          !retriableErrors.some(err => staxFetchImageState.error instanceof err);
        if (staxFetchImageState.imageFetched || unrecoverableError) {
          if (staxFetchImageState.error)
            log("FirmwareUpdate", "error while backing up stax image", staxFetchImageState.error);
          proceedToFirmwareUpdate();
        }
        break;
      case "firmwareUpdate":
        if (updateActionState.step === "preparingUpdate" && !updateActionState.lockedDevice) {
          triggerUpdate();
        } else if (updateActionState.step === "firmwareUpdateCompleted") {
          proceedToLanguageRestore();
        }
        break;
      case "languageRestore":
        unrecoverableError =
          installLanguageState.error &&
          !retriableErrors.some(err => installLanguageState.error instanceof err);
        if (installLanguageState.languageInstalled || unrecoverableError) {
          if (installLanguageState.error)
            log("FirmwareUpdate", "error while restoring language", installLanguageState.error);
          proceedToImageRestore();
        }
        break;
      case "imageRestore":
        unrecoverableError =
          staxLoadImageState.error &&
          !retriableErrors.some(err => staxLoadImageState.error instanceof err);
        if (staxLoadImageState.imageLoaded || unrecoverableError || !staxFetchImageState.hexImage) {
          if (staxLoadImageState.error) {
            log("FirmwareUpdate", "error while restoring stax image", staxLoadImageState.error);
          }
          proceedToAppsRestore();
        }
        break;
      case "appsRestore":
        unrecoverableError =
          restoreAppsState.error &&
          !retriableErrors.some(err => restoreAppsState.error instanceof err);
        if (restoreAppsState.opened || unrecoverableError) {
          if (restoreAppsState.error) {
            log("FirmwareUpdate", "error while restoring apps", restoreAppsState.error);
          }
          proceedToUpdateCompleted();
        }
        break;
      default:
        break;
    }
  }, [
    device.modelId,
    deviceInfo.languageId,
    connectManagerState.result,
    installLanguageState.error,
    installLanguageState.languageInstalled,
    proceedToFirmwareUpdate,
    proceedToAppsRestore,
    proceedToImageBackup,
    proceedToImageRestore,
    proceedToLanguageRestore,
    proceedToUpdateCompleted,
    staxFetchImageState.error,
    staxFetchImageState.imageFetched,
    staxFetchImageState.hexImage,
    staxLoadImageState.error,
    staxLoadImageState.imageLoaded,
    triggerUpdate,
    updateActionState.step,
    updateActionState.lockedDevice,
    updateStep,
    restoreAppsState.error,
    restoreAppsState.opened,
    proceedToAppsBackup,
    connectManagerState.error,
  ]);

  const hasReconnectErrors = useMemo(
    () =>
      reconnectDeviceErrors.some(
        err =>
          connectManagerState.error instanceof err ||
          staxFetchImageState.error instanceof err ||
          staxLoadImageState.error instanceof err ||
          restoreAppsState.error instanceof err ||
          installLanguageState.error instanceof err,
      ),
    [
      connectManagerState.error,
      staxFetchImageState.error,
      staxLoadImageState.error,
      restoreAppsState.error,
      installLanguageState.error,
    ],
  );

  const restoreStepDeniedError = useMemo(() => {
    if (
      updateStep === "languageRestore" &&
      installLanguageState.error &&
      installLanguageState.error instanceof LanguageInstallRefusedOnDevice
    ) {
      return installLanguageState.error;
    }

    if (
      updateStep === "imageRestore" &&
      staxLoadImageState.error &&
      (staxLoadImageState.error instanceof ImageLoadRefusedOnDevice ||
        (staxLoadImageState.error as unknown) instanceof ImageCommitRefusedOnDevice)
    ) {
      return staxLoadImageState.error;
    }

    if (
      updateStep === "appsRestore" &&
      restoreAppsState.error &&
      restoreAppsState.error instanceof UserRefusedAllowManager
    ) {
      return restoreAppsState.error;
    }

    return undefined;
  }, [installLanguageState.error, staxLoadImageState.error, restoreAppsState.error, updateStep]);

  const deviceLockedOrUnresponsive = useMemo(
    () =>
      updateActionState.lockedDevice ||
      connectManagerState.isLocked ||
      staxFetchImageState.unresponsive ||
      staxLoadImageState.unresponsive ||
      restoreAppsState.isLocked ||
      installLanguageState.unresponsive,
    [
      updateActionState.lockedDevice,
      connectManagerState.isLocked,
      staxFetchImageState.unresponsive,
      staxLoadImageState.unresponsive,
      restoreAppsState.isLocked,
      installLanguageState.unresponsive,
    ],
  );

  const retryCurrentStep = useCallback(() => {
    switch (updateStep) {
      case "appsBackup":
        connectManagerState.onRetry();
        break;
      case "appsRestore":
        restoreAppsState.onRetry();
        break;
      case "firmwareUpdate":
        triggerUpdate();
        break;
      case "imageBackup":
        staxFetchImageState.onRetry();
        break;
      case "imageRestore":
        staxLoadImageState.onRetry();
        break;
      case "languageRestore":
        installLanguageState.onRetry();
        break;
      default:
        break;
    }
  }, [
    connectManagerState,
    installLanguageState,
    restoreAppsState,
    staxFetchImageState,
    staxLoadImageState,
    triggerUpdate,
    updateStep,
  ]);

  const skipCurrentRestoreStep = useCallback(() => {
    switch (updateStep) {
      case "languageRestore":
        proceedToImageRestore();
        break;
      case "imageRestore":
        proceedToAppsRestore();
        break;
      case "appsRestore":
        proceedToUpdateCompleted();
        break;
      default:
        break;
    }
  }, [updateStep, proceedToImageRestore, proceedToAppsRestore, proceedToUpdateCompleted]);

  return {
    updateStep,
    connectManagerState,
    staxFetchImageState,
    updateActionState,
    staxLoadImageState,
    installLanguageState,
    restoreAppsState,
    retryCurrentStep,
    skipCurrentRestoreStep,
    noOfAppsToReinstall: installedApps.length,
    deviceLockedOrUnresponsive,
    hasReconnectErrors,
    restoreStepDeniedError,
  };
};
