import { CropResult } from "../../components/CustomImage/ImageCropper";
import {
  ProcessorPreviewResult,
  ProcessorRawResult,
} from "../../components/CustomImage/ImageProcessor";
import { ImageFileUri, ImageUrl } from "../../components/CustomImage/types";

type Step1CroppingParams = (ImageUrl | ImageFileUri) & {
  isPictureFromGallery?: boolean;
};

type Step2PreviewParams = CropResult;

type Step3TransferParams = {
  rawData: ProcessorRawResult;
  previewData: ProcessorPreviewResult;
};

type ErrorScreenParams = { error: Error };

export type ParamList = {
  CustomImageStep1Crop: Step1CroppingParams;
  CustomImageStep2Preview: Step2PreviewParams;
  CustomImageStep3Transfer: Step3TransferParams;
  CustomImageErrorScreen: ErrorScreenParams;
};
