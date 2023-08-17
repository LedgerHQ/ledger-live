import { log } from "@ledgerhq/logs";
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
  UnresponsiveDeviceError,
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
import {
  useAppDeviceAction,
  useInstallLanguageDeviceAction,
  useManagerDeviceAction,
  useStaxFetchImageDeviceAction,
  useStaxLoadImageDeviceAction,
} from "../../hooks/deviceActions";

// Errors related to the device connection
export const reconnectDeviceErrorClasses: LedgerErrorConstructor<{
  [key: string]: unknown;
}>[] = [
  CantOpenDevice,
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
  LockedDeviceError,
  UnresponsiveDeviceError,
  ConnectManagerTimeout,
];

// Errors that could be solved by the user: either on their phone or on their device
export const userSolvableErrorClasses: LedgerErrorConstructor<{
  [key: string]: unknown;
}>[] = [
  ...reconnectDeviceErrorClasses,
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

export const useUpdateFirmwareAndRestoreSettings = ({
  updateFirmwareAction,
  device,
  deviceInfo,
}: FirmwareUpdateParams) => {
  const [updateStep, setUpdateStep] = useState<UpdateStep>("start");
  const [installedApps, setInstalledApps] = useState<string[]>([]);

  const installLanguageAction = useInstallLanguageDeviceAction();
  const staxLoadImageAction = useStaxLoadImageDeviceAction();
  const staxFetchImageAction = useStaxFetchImageDeviceAction();
  const connectManagerAction = useManagerDeviceAction();

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

  const connectAppAction = useAppDeviceAction();

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

  // Controls the chaining of device actions by updating the current step when needed.
  // You can see it as a state machine.
  // On "unrecoverable" errors we try to go to the next step to avoid letting the device is an unknown state
  useEffect(() => {
    let hasUnrecoverableError;

    switch (updateStep) {
      case "appsBackup":
        hasUnrecoverableError =
          connectManagerState.error &&
          !userSolvableErrorClasses.some(err => connectManagerState.error instanceof err);

        if (connectManagerState.result || hasUnrecoverableError) {
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
        hasUnrecoverableError =
          staxFetchImageState.error &&
          !userSolvableErrorClasses.some(err => staxFetchImageState.error instanceof err);

        if (staxFetchImageState.imageFetched || hasUnrecoverableError) {
          if (staxFetchImageState.error) {
            log("FirmwareUpdate", "error while backing up stax image", staxFetchImageState.error);
          }
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
        hasUnrecoverableError =
          installLanguageState.error &&
          !userSolvableErrorClasses.some(err => installLanguageState.error instanceof err);

        if (installLanguageState.languageInstalled || hasUnrecoverableError) {
          if (installLanguageState.error) {
            log("FirmwareUpdate", "error while restoring language", installLanguageState.error);
          }
          proceedToImageRestore();
        }
        break;

      case "imageRestore":
        hasUnrecoverableError =
          staxLoadImageState.error &&
          !userSolvableErrorClasses.some(err => staxLoadImageState.error instanceof err);

        if (
          staxLoadImageState.imageLoaded ||
          hasUnrecoverableError ||
          !staxFetchImageState.hexImage
        ) {
          if (staxLoadImageState.error) {
            log("FirmwareUpdate", "error while restoring stax image", staxLoadImageState.error);
          }
          proceedToAppsRestore();
        }
        break;

      case "appsRestore":
        hasUnrecoverableError =
          restoreAppsState.error &&
          !userSolvableErrorClasses.some(err => restoreAppsState.error instanceof err);

        if (restoreAppsState.opened || hasUnrecoverableError) {
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
      reconnectDeviceErrorClasses.some(
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

  /**
   * An error from the (current) fw update step that can be solved by a user action.
   *
   * If there is an error during the current fw update step but it is not user-solvable,
   * then either: this current fw update step is skipped or this error is ignored
   * And in both cases: nothing should be displayed to the user (logs are saved).
   *
   * Especially: a `TransportRaceCondition` error is to be expected since we chain multiple
   * device actions that use different transport acquisition paradigms the action should,
   * however, retry to execute and resolve the error by itself.
   * There is no need to present the error to the user.
   */
  const userSolvableError = useMemo(
    () =>
      [
        connectManagerState.error,
        staxFetchImageState.error,
        updateActionState.error,
        installLanguageState.error,
        restoreAppsState.error,
        staxLoadImageState.error,
      ].find(error => userSolvableErrorClasses.some(errorClass => error instanceof errorClass)),
    [
      connectManagerState.error,
      installLanguageState.error,
      restoreAppsState.error,
      staxFetchImageState.error,
      staxLoadImageState.error,
      updateActionState.error,
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
    startUpdate: proceedToAppsBackup,
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
    userSolvableError,
    restoreStepDeniedError,
  };
};
