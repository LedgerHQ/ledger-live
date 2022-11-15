import { Device } from "@ledgerhq/types-devices";

import { ScreenName } from "../../../const";
import { CropResult } from "../../CustomImage/ImageCropper";
import {
  ProcessorPreviewResult,
  ProcessorRawResult,
} from "../../CustomImage/ImageProcessor";
import { ImageFileUri, ImageUrl } from "../../CustomImage/types";
import { ResizeResult } from "../../CustomImage/useResizedImage";

type BaseParams = {
  device: Device | null;
};

export type CustomImageNavigatorParamList = {
  [ScreenName.CustomImageStep0Welcome]: BaseParams;
  [ScreenName.CustomImageStep1Crop]: BaseParams &
    (ImageUrl | ImageFileUri) & {
      isPictureFromGallery?: boolean;
    };
  [ScreenName.CustomImageStep2Preview]: BaseParams &
    (ImageUrl | ImageFileUri) & {
      cropResult: CropResult;
    };
  [ScreenName.CustomImageStep3Transfer]: BaseParams & {
    rawData: ProcessorRawResult;
    previewData: ProcessorPreviewResult;
  };
  [ScreenName.CustomImageErrorScreen]: BaseParams & { error: Error };
  [ScreenName.CustomImagePreviewPreEdit]: BaseParams &
    (ImageUrl | ImageFileUri) & {
      isPictureFromGallery?: boolean;
    };
  [ScreenName.CustomImagePreviewPostEdit]: BaseParams &
    (ImageUrl | ImageFileUri) & {
      image: ResizeResult | null;
      contrast: number;
    };
};
