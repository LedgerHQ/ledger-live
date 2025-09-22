import { Device } from "@ledgerhq/types-devices";
import { type CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { ScreenName } from "~/const";
import { CropResult } from "../../CustomImage/ImageCropper";
import { ProcessorPreviewResult, ProcessorRawResult } from "../../CustomImage/dithering/types";
import { ImageFileUri, ImageType } from "../../CustomImage/types";

type BaseParams = {
  device: Device | null;
};

type WithMandatoryDeviceModelId = {
  deviceModelId: CLSSupportedDeviceModelId;
};

type WithOptionalDeviceModelId = {
  // in some cases (deeplink), the deviceModelId is undetermined
  deviceModelId: CLSSupportedDeviceModelId | null;
  referral?: string;
};

export type CustomImageNavigatorParamList = {
  [ScreenName.CustomImageErrorScreen]: BaseParams & WithOptionalDeviceModelId & { error: Error };
  [ScreenName.CustomImageStep0Welcome]: undefined | (BaseParams & WithOptionalDeviceModelId); // undefined is because it can be called without params (deeplink)
  [ScreenName.CustomImagePreviewPreEdit]: BaseParams & WithOptionalDeviceModelId & ImageFileUri;
  [ScreenName.CustomImageStep1Crop]: BaseParams &
    WithMandatoryDeviceModelId & {
      baseImageFile: ImageFileUri;
      imageType: ImageType;
      isPictureFromGallery?: boolean;
    };
  [ScreenName.CustomImageStep2ChooseContrast]: BaseParams &
    WithMandatoryDeviceModelId & {
      baseImageFile: ImageFileUri;
      imageType: ImageType;
      cropResult: CropResult;
    };
  [ScreenName.CustomImagePreviewPostEdit]: BaseParams &
    WithMandatoryDeviceModelId & {
      baseImageFile: ImageFileUri;
      imageType: ImageType;
      imageData: ProcessorRawResult;
      imagePreview: ProcessorPreviewResult;
    };
  [ScreenName.CustomImageStep3Transfer]: BaseParams &
    WithMandatoryDeviceModelId & {
      imageType: ImageType;
      rawData: ProcessorRawResult;
      previewData: ProcessorPreviewResult;
      referral?: string;
    };
  [ScreenName.CustomImageRemoval]: BaseParams & {
    setDeviceHasImage?: (hasImage: boolean) => void;
    referral?: string;
  };
};
