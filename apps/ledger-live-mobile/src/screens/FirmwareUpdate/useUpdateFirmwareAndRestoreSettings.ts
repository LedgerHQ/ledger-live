import staxLoadImage from "@ledgerhq/live-common/hw/staxLoadImage";
import staxFetchImage from "@ledgerhq/live-common/hw/staxFetchImage";
import { createAction as createStaxLoadImageAction } from "@ledgerhq/live-common/hw/actions/staxLoadImage";
import { createAction as createStaxFetchImageAction } from "@ledgerhq/live-common/hw/actions/staxFetchImage";
import { useUpdateFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useUpdateFirmware";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import {
  UpdateFirmwareActionState,
  updateFirmwareActionArgs,
} from "@ledgerhq/live-common/deviceSDK/actions/updateFirmware";
import { Observable } from "rxjs";
import { useEffect, useMemo, useState } from "react";
import { log } from "@ledgerhq/logs";

export type FirmwareUpdateParams = {
  device: Device;
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

const staxLoadImageAction = createStaxLoadImageAction(staxLoadImage);
const staxFetchImageAction = createStaxFetchImageAction(staxFetchImage);

export const useUpdateFirmwareAndRestoreSettings = ({
  updateFirmwareAction,
  device,
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

  useEffect(() => {
    switch (updateStep) {
      case "start":
        if (device.modelId === DeviceModelId.stax) {
          setUpdateStep("imageBackup");
        } else {
          setUpdateStep("firmwareUpdate");
        }
        break;
      case "imageBackup":
        // Only logging for now
        if (staxLoadImageState.error) {
          log(
            "UpdateFirmwareAndRestoreSettings",
            "Unable to fetch image",
            staxFetchImageState.error,
          );
        }

        if (staxFetchImageState.imageFetched || staxFetchImageState.error) {
          // TODO: check if we want to do something with error, maybe just log it
          setUpdateStep("firmwareUpdate");
        }
        break;
      case "firmwareUpdate":
        if (updateActionState.step === "preparingUpdate") {
          triggerUpdate();
        } else if (updateActionState.step === "firmwareUpdateCompleted") {
          setUpdateStep("languageRestore");
        }
        break;
      case "languageRestore":
        // TODO: implement image restore
        setUpdateStep("imageRestore");
        break;
      case "imageRestore":
        // Only logging for now
        if (staxLoadImageState.error) {
          log(
            "UpdateFirmwareAndRestoreSettings",
            "Unable to restore image",
            staxLoadImageState.error,
          );
        }

        if (
          staxLoadImageState.imageLoaded ||
          staxLoadImageState.error ||
          !staxFetchImageState.hexImage
        ) {
          setUpdateStep("appsRestore");
        }
        break;
      case "appsRestore":
        setUpdateStep("completed");
        break;
      default:
        break;
    }
  }, [
    device.modelId,
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
    retryUpdate: triggerUpdate,
  };
};
