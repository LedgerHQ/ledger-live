import { Device } from "@ledgerhq/types-devices";
import { type CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { ScreenName } from "~/const";
import { CropResult } from "../../CustomImage/ImageCropper";
import { ProcessorPreviewResult, ProcessorRawResult } from "../../CustomImage/ImageProcessor";
import { GalleryNFT, ImageFileUri, ImageUrl, ImageType } from "../../CustomImage/types";

type BaseParams = {
  device: Device | null;
  deviceModelId: CLSSupportedDeviceModelId;
};

type PreviewPreEditAdditionalParams = (ImageUrl | ImageFileUri | GalleryNFT) & {
  isPictureFromGallery?: boolean;
  isStaxEnabled?: boolean;
};

export type CustomImageNavigatorParamList = {
  [ScreenName.CustomImageStep0Welcome]: BaseParams;
  [ScreenName.CustomImageStep1Crop]: BaseParams & {
    baseImageFile: ImageFileUri;
    imageType: ImageType;
    isPictureFromGallery?: boolean;
  };
  [ScreenName.CustomImageStep2Preview]: BaseParams & {
    baseImageFile: ImageFileUri;
    imageType: ImageType;
    cropResult: CropResult;
  };
  [ScreenName.CustomImageStep3Transfer]: BaseParams & {
    imageType: ImageType;
    rawData: ProcessorRawResult;
    previewData: ProcessorPreviewResult;
  };
  [ScreenName.CustomImageErrorScreen]: BaseParams & { error: Error };
  [ScreenName.CustomImagePreviewPreEditDevicePicker]: Omit<BaseParams, "deviceModelId"> &
    PreviewPreEditAdditionalParams;
  [ScreenName.CustomImagePreviewPreEdit]: BaseParams & PreviewPreEditAdditionalParams;
  [ScreenName.CustomImagePreviewPostEdit]: BaseParams & {
    baseImageFile: ImageFileUri;
    imageType: ImageType;
    imageData: ProcessorRawResult;
    imagePreview: ProcessorPreviewResult;
  };
  [ScreenName.CustomImageNFTGallery]: BaseParams;
};
