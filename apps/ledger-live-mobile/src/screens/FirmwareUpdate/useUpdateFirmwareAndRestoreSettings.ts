import { log } from "@ledgerhq/logs";
import { useUpdateFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useUpdateFirmware";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  UpdateFirmwareActionState,
  updateFirmwareActionArgs,
} from "@ledgerhq/live-common/deviceSDK/actions/updateFirmware";
import { Observable } from "rxjs";
import { useCallback, useMemo, useEffect, useState } from "react";
import { DeviceInfo, idsToLanguage, languageIds } from "@ledgerhq/types-live";
import {
  CantOpenDevice,
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
  LockedDeviceError,
  UnresponsiveDeviceError,
  UserRefusedAllowManager,
  WebsocketConnectionError,
  WebsocketConnectionFailed,
  CustomErrorClassType,
  TransportStatusErrorClassType,
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
  useFetchImageDeviceAction,
  useLoadImageDeviceAction,
} from "../../hooks/deviceActions";
import { isCustomLockScreenSupported } from "@ledgerhq/live-common/device/use-cases/screenSpecs";

// Errors related to the device connection
export const reconnectDeviceErrorClasses: Array<
  CustomErrorClassType | TransportStatusErrorClassType
> = [
  CantOpenDevice,
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
  LockedDeviceError,
  UnresponsiveDeviceError,
  ConnectManagerTimeout,
];

// Errors that could be solved by the user: either on their phone or on their device
export const userSolvableErrorClasses: Array<CustomErrorClassType | TransportStatusErrorClassType> =
  [
    ...reconnectDeviceErrorClasses,
    WebsocketConnectionError,
    UserRefusedAllowManager,
    LanguageInstallRefusedOnDevice,
    ImageCommitRefusedOnDevice,
    ImageLoadRefusedOnDevice,
    WebsocketConnectionFailed,
    DisconnectedDeviceDuringOperation,
  ];

export type FirmwareUpdateParams = {
  device: Device;
  deviceInfo: DeviceInfo;
  updateFirmwareAction?(args: updateFirmwareActionArgs): Observable<UpdateFirmwareActionState>;
  isBeforeOnboarding?: boolean;
};

export type UpdateStep =
  | "start"
  | "appsBackup"
  // | "appsDataBackup"
  | "imageBackup"
  | "firmwareUpdate"
  | "languageRestore"
  | "imageRestore"
  | "appsRestore"
  | "completed";

/**
 * Handles the full logic of a firmware update + restoring settings like the locked screen image or apps
 *
 * @param isBeforeOnboarding: to adapt the firmware update in case the device is starting
 *   its onboarding and it's normal it is not yet seeded. If set to true, short-circuit some steps that are unnecessary
 */
export const useUpdateFirmwareAndRestoreSettings = ({
  updateFirmwareAction,
  device,
  deviceInfo,
  isBeforeOnboarding = false,
}: FirmwareUpdateParams) => {
  const [updateStep, setUpdateStep] = useState<UpdateStep>("start");
  const [installedApps, setInstalledApps] = useState<string[]>([]);

  const installLanguageAction = useInstallLanguageDeviceAction();
  const loadImageAction = useLoadImageDeviceAction();
  const fetchImageAction = useFetchImageDeviceAction();
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

  const fetchImageRequest = useMemo(
    () => ({
      // In the LLM fwm update flow, the error thrown because there is no image is caught and part of the normal flow
      // So we want it to throw the error.
      allowedEmpty: false,
      deviceModelId: device.modelId,
    }),
    [device.modelId],
  );
  const fetchImageState = fetchImageAction.useHook(
    updateStep === "imageBackup" ? device : null,
    fetchImageRequest,
  );

  const { updateState: updateActionState, triggerUpdate } = useUpdateFirmware({
    deviceId: device.deviceId ?? "",
    deviceName: device.deviceName ?? null,
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

  const loadImageRequest = useMemo(
    () =>
      isCustomLockScreenSupported(device.modelId)
        ? {
            hexImage: fetchImageState.hexImage ?? "",
            padImage: false, // this is because the picture we fetch from the device already has the padding
            deviceModelId: device.modelId,
          }
        : undefined,
    [fetchImageState.hexImage, device.modelId],
  );
  const loadImageState = loadImageAction.useHook(
    updateStep === "imageRestore" && fetchImageState.hexImage ? device : null,
    loadImageRequest,
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
    if (isCustomLockScreenSupported(device.modelId)) {
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
    if (fetchImageState.hexImage) {
      setUpdateStep("imageRestore");
    } else {
      proceedToAppsRestore();
    }
  }, [proceedToAppsRestore, fetchImageState.hexImage]);

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
          fetchImageState.error &&
          !userSolvableErrorClasses.some(err => fetchImageState.error instanceof err);

        if (fetchImageState.imageFetched || hasUnrecoverableError) {
          if (fetchImageState.error) {
            log("FirmwareUpdate", "error while backing up CLS image", fetchImageState.error);
          }
          proceedToFirmwareUpdate();
        }
        break;

      case "firmwareUpdate":
        hasUnrecoverableError =
          updateActionState.error &&
          !userSolvableErrorClasses.some(
            err =>
              updateActionState.error instanceof err ||
              updateActionState.error?.name === "TimeoutError",
          );

        if (updateActionState.step === "preparingUpdate" && !updateActionState.lockedDevice) {
          triggerUpdate();
        } else if (updateActionState.step === "firmwareUpdateCompleted" || hasUnrecoverableError) {
          if (hasUnrecoverableError) {
            log("FirmwareUpdate", "error while updating firmware", updateActionState.error);
          }

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

          if (isBeforeOnboarding) {
            proceedToUpdateCompleted();
          } else {
            proceedToImageRestore();
          }
        }
        break;

      case "imageRestore":
        hasUnrecoverableError =
          loadImageState.error &&
          !userSolvableErrorClasses.some(err => loadImageState.error instanceof err);

        if (loadImageState.imageLoaded || hasUnrecoverableError || !fetchImageState.hexImage) {
          if (loadImageState.error) {
            log("FirmwareUpdate", "error while restoring CLS image", loadImageState.error);
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
    fetchImageState.error,
    fetchImageState.imageFetched,
    fetchImageState.hexImage,
    loadImageState.error,
    loadImageState.imageLoaded,
    triggerUpdate,
    updateActionState.step,
    updateActionState.error,
    updateActionState.lockedDevice,
    updateStep,
    restoreAppsState.error,
    restoreAppsState.opened,
    proceedToAppsBackup,
    connectManagerState.error,
    isBeforeOnboarding,
  ]);

  const startUpdate = useCallback(() => {
    // The backup of the language package is actually done using the input device info `languageId`
    if (isBeforeOnboarding) {
      proceedToFirmwareUpdate();
    } else {
      proceedToAppsBackup();
    }
  }, [isBeforeOnboarding, proceedToAppsBackup, proceedToFirmwareUpdate]);

  const hasReconnectErrors = useMemo(
    () =>
      reconnectDeviceErrorClasses.some(
        err =>
          connectManagerState.error instanceof err ||
          fetchImageState.error instanceof err ||
          loadImageState.error instanceof err ||
          restoreAppsState.error instanceof err ||
          installLanguageState.error instanceof err,
      ),
    [
      connectManagerState.error,
      fetchImageState.error,
      loadImageState.error,
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
        fetchImageState.error,
        updateActionState.error,
        installLanguageState.error,
        restoreAppsState.error,
        loadImageState.error,
      ].find(error => userSolvableErrorClasses.some(errorClass => error instanceof errorClass)),
    [
      connectManagerState.error,
      installLanguageState.error,
      restoreAppsState.error,
      fetchImageState.error,
      loadImageState.error,
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
      loadImageState.error &&
      (loadImageState.error instanceof ImageLoadRefusedOnDevice ||
        (loadImageState.error as unknown) instanceof ImageCommitRefusedOnDevice)
    ) {
      return loadImageState.error;
    }

    if (
      updateStep === "appsRestore" &&
      restoreAppsState.error &&
      restoreAppsState.error instanceof UserRefusedAllowManager
    ) {
      return restoreAppsState.error;
    }

    return undefined;
  }, [installLanguageState.error, loadImageState.error, restoreAppsState.error, updateStep]);

  const deviceLockedOrUnresponsive = useMemo(
    () =>
      updateActionState.lockedDevice ||
      connectManagerState.isLocked ||
      fetchImageState.unresponsive ||
      loadImageState.unresponsive ||
      restoreAppsState.isLocked ||
      installLanguageState.unresponsive,
    [
      updateActionState.lockedDevice,
      connectManagerState.isLocked,
      fetchImageState.unresponsive,
      loadImageState.unresponsive,
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
        fetchImageState.onRetry();
        break;
      case "imageRestore":
        loadImageState.onRetry();
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
    fetchImageState,
    loadImageState,
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
    startUpdate,
    updateStep,
    connectManagerState,
    fetchImageState,
    updateActionState,
    loadImageState,
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
