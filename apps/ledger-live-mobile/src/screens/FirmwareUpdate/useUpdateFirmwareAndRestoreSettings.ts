import { log } from "@ledgerhq/logs";
import staxLoadImage from "@ledgerhq/live-common/hw/staxLoadImage";
import staxFetchImage from "@ledgerhq/live-common/hw/staxFetchImage";
import installLanguage from "@ledgerhq/live-common/hw/installLanguage";
import { createAction as createStaxLoadImageAction } from "@ledgerhq/live-common/hw/actions/staxLoadImage";
import { createAction as createStaxFetchImageAction } from "@ledgerhq/live-common/hw/actions/staxFetchImage";
import { createAction as createInstallLanguageAction } from "@ledgerhq/live-common/hw/actions/installLanguage";
import { useUpdateFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useUpdateFirmware";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import {
  UpdateFirmwareActionState,
  updateFirmwareActionArgs,
} from "@ledgerhq/live-common/deviceSDK/actions/updateFirmware";
import { Observable } from "rxjs";
import { useCallback, useMemo, useEffect, useState } from "react";
import { DeviceInfo, idsToLanguage, languageIds } from "@ledgerhq/types-live";

export type FirmwareUpdateParams = {
  device: Device;
  deviceInfo: DeviceInfo;
  updateFirmwareAction?: (
    args: updateFirmwareActionArgs,
  ) => Observable<UpdateFirmwareActionState>;
};

export type UpdateStep =
  | "start"
  | "imageBackup"
  | "firmwareUpdate"
  | "languageRestore"
  | "imageRestore"
  | "appsRestore"
  | "completed";

const installLanguageAction = createInstallLanguageAction(installLanguage);
const staxLoadImageAction = createStaxLoadImageAction(staxLoadImage);
const staxFetchImageAction = createStaxFetchImageAction(staxFetchImage);

export const useUpdateFirmwareAndRestoreSettings = ({
  updateFirmwareAction,
  device,
  deviceInfo,
}: FirmwareUpdateParams) => {
  const [updateStep, setUpdateStep] = useState<UpdateStep>("start");

  const staxFetchImageRequest = useMemo(() => ({}), []);
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
    updateStep === "imageRestore" && staxFetchImageState.hexImage
      ? device
      : null,
    staxLoadImageRequest,
  );

  const proceedToFirmwareUpdate = useCallback(() => {
    setUpdateStep("firmwareUpdate");
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
    // TODO: if no apps to restore proceed to update completed
    setUpdateStep("appsRestore");
  }, []);

  const proceedToImageRestore = useCallback(() => {
    if (staxFetchImageState.hexImage) {
      setUpdateStep("imageRestore");
    } else {
      proceedToAppsRestore();
    }
  }, [proceedToAppsRestore, staxFetchImageState.hexImage]);

  const proceedToLanguageRestore = useCallback(() => {
    if (
      deviceInfo.languageId !== undefined &&
      deviceInfo.languageId !== languageIds.english
    ) {
      setUpdateStep("languageRestore");
    } else {
      setUpdateStep("imageRestore");
    }
  }, [deviceInfo.languageId]);

  useEffect(() => {
    switch (updateStep) {
      case "start":
        proceedToImageBackup();
        break;
      case "imageBackup":
        if (staxFetchImageState.imageFetched || staxFetchImageState.error) {
          if (staxFetchImageState.error)
            log(
              "FirmwareUpdate",
              "error while backing up stax image",
              staxFetchImageState.error,
            );
          proceedToFirmwareUpdate();
        }
        break;
      case "firmwareUpdate":
        if (updateActionState.step === "preparingUpdate") {
          triggerUpdate();
        } else if (updateActionState.step === "firmwareUpdateCompleted") {
          proceedToLanguageRestore();
        }
        break;
      case "languageRestore":
        if (
          installLanguageState.languageInstalled ||
          installLanguageState.error
        ) {
          if (installLanguageState.error)
            log(
              "FirmwareUpdate",
              "error while restoring language",
              installLanguageState.error,
            );
          proceedToImageRestore();
        }
        break;
      case "imageRestore":
        if (
          staxLoadImageState.imageLoaded ||
          staxLoadImageState.error ||
          !staxFetchImageState.hexImage
        ) {
          if (staxLoadImageState.error)
            log(
              "FirmwareUpdate",
              "error while restoring stax image",
              installLanguageState.error,
            );
          proceedToAppsRestore();
        }
        break;
      case "appsRestore":
        proceedToUpdateCompleted();
        break;
      default:
        break;
    }
  }, [
    device.modelId,
    deviceInfo.languageId,
    installLanguageState.error,
    installLanguageState.languageInstalled,
    proceedToAppsRestore,
    proceedToFirmwareUpdate,
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
    updateStep,
  ]);

  return {
    updateStep,
    staxFetchImageState,
    updateActionState,
    staxLoadImageState,
    installLanguageState,
    retryUpdate: triggerUpdate,
  };
};
