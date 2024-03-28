import { ImageCropError } from "@ledgerhq/live-common/customImage/errors";
import { ImageDimensions } from "../types";

type CropParams = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

/**
 * Returns the parameters to crop an image in the center.
 * @param imageDimensions The dimensions of the image to crop
 * @param cropDimensions The dimensions of the container to crop in
 * @returns The parameters to crop the image in the center
 */
export function getCenteredCropParams(
  imageDimensions: ImageDimensions,
  cropDimensions: ImageDimensions,
): CropParams {
  if (
    cropDimensions.width > imageDimensions.width ||
    cropDimensions.height > imageDimensions.height
  ) {
    throw new ImageCropError("The cropping dimensions must be smaller than the image dimensions");
  }
  return {
    width: cropDimensions.width,
    height: cropDimensions.height,
    originX: Math.abs(Math.floor((cropDimensions.width - imageDimensions.width) / 2)),
    originY: Math.abs(Math.floor((cropDimensions.height - imageDimensions.height) / 2)),
  };
}
