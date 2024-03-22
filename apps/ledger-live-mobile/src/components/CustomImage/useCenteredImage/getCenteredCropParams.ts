import { ImageDimensions } from "../types";

/**
 * Returns the parameters to crop an image in the center.
 * @param imageDimensions The dimensions of the image to crop
 * @param containerDimensions The dimensions of the container to crop in
 * @returns The parameters to crop the image in the center
 */

export function getCenteredCropParams(
  imageDimensions: ImageDimensions,
  containerDimensions: ImageDimensions,
): { originX: number; originY: number; width: number; height: number } {
  return {
    width: containerDimensions.width,
    height: containerDimensions.height,
    originX: Math.abs(Math.floor((containerDimensions.width - imageDimensions.width) / 2)),
    originY: Math.abs(Math.floor((containerDimensions.height - imageDimensions.height) / 2)),
  };
}
