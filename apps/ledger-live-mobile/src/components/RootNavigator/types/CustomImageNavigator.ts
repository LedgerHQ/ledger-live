import { Device } from "@ledgerhq/types-devices";
import { ProtoNFT } from "@ledgerhq/types-live";

import { ScreenName } from "../../../const";
import { CropResult } from "../../CustomImage/ImageCropper";
import {
  ProcessorPreviewResult,
  ProcessorRawResult,
} from "../../CustomImage/ImageProcessor";
import { ImageFileUri, ImageUrl } from "../../CustomImage/types";

type GalleryNFT = {
  nft: ProtoNFT;
};

type BaseParams = {
  device: Device | null;
};

export type CustomImageNavigatorParamList = {
  [ScreenName.CustomImageStep0Welcome]: BaseParams;
  [ScreenName.CustomImageStep1Crop]: BaseParams & {
    baseImageFile: ImageFileUri;
  };
  [ScreenName.CustomImageStep2Preview]: BaseParams & {
    baseImageFile: ImageFileUri;
    cropResult: CropResult;
  };
  [ScreenName.CustomImageStep3Transfer]: BaseParams & {
    rawData: ProcessorRawResult;
    previewData: ProcessorPreviewResult;
  };
  [ScreenName.CustomImageErrorScreen]: BaseParams & { error: Error };
  [ScreenName.CustomImagePreviewPreEdit]: BaseParams &
    (ImageUrl | ImageFileUri | GalleryNFT) & {
      isPictureFromGallery?: boolean;
    };
  [ScreenName.CustomImagePreviewPostEdit]: BaseParams & {
    baseImageFile: ImageFileUri;
    imageData: ProcessorRawResult;
    imagePreview: ProcessorPreviewResult;
  };
  [ScreenName.CustomImageNFTGallery]: BaseParams;
};
