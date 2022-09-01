import { ScreenName } from "../../../const";
import { CropResult } from "../../CustomImage/ImageCropper";
import {
  ProcessorPreviewResult,
  ProcessorRawResult,
} from "../../CustomImage/ImageProcessor";
import { ImageFileUri, ImageUrl } from "../../CustomImage/types";

export type CustomImageNavigatorParamList = {
  [ScreenName.CustomImageStep1Crop]: (ImageUrl | ImageFileUri) & {
    isPictureFromGallery?: boolean;
  };
  [ScreenName.CustomImageStep2Preview]: CropResult;
  [ScreenName.CustomImageStep3Transfer]: {
    rawData: ProcessorRawResult;
    previewData: ProcessorPreviewResult;
  };
  [ScreenName.CustomImageErrorScreen]: { error: Error };
};
