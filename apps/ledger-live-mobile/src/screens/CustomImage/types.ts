import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CropResult } from "../../components/CustomImage/ImageCropper";
import {
  ProcessorPreviewResult,
  ProcessorRawResult,
} from "../../components/CustomImage/ImageProcessor";
import { ImageFileUri, ImageUrl } from "../../components/CustomImage/types";

type BaseParams = {
  device: Device | null;
};

type Step0WelcomeParams = BaseParams;

type Step1CroppingParams = BaseParams &
  (ImageUrl | ImageFileUri) & {
    isPictureFromGallery?: boolean;
  };

type Step2PreviewParams = BaseParams & {
  cropResult: CropResult;
};

type Step3TransferParams = BaseParams & {
  rawData: ProcessorRawResult;
  previewData: ProcessorPreviewResult;
};

type ErrorScreenParams = BaseParams & { error: Error };

export type ParamList = {
  CustomImageStep0Welcome: Step0WelcomeParams;
  CustomImageStep1Crop: Step1CroppingParams;
  CustomImageStep2Preview: Step2PreviewParams;
  CustomImageStep3Transfer: Step3TransferParams;
  CustomImageErrorScreen: ErrorScreenParams;
};
