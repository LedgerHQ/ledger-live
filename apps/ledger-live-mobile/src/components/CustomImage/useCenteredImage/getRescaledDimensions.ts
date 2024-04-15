import { ImageDimensions } from "../types";

/**
 * Returns the dimensions of an image that has been resized to fully cover a box,
 * while keeping its aspect ratio.
 * This should behave like the CSS `object-fit: contain` property.
 *
 * @param imageDimensions The dimensions of the image to fit
 * @param containerDimensions The dimensions of the container to fit in
 * @returns The dimensions of the image that fits in the container while keeping its aspect ratio
 */

export function getRescaledDimensions(
  imageDimensions: ImageDimensions,
  containerDimensions: ImageDimensions,
): ImageDimensions {
  if (
    [
      containerDimensions.width,
      containerDimensions.height,
      imageDimensions.width,
      imageDimensions.height,
    ].some(val => val === 0)
  )
    return { height: 0, width: 0 };
  const getImageRatio = (dimensions: ImageDimensions) => dimensions.height / dimensions.width;

  const targetRatio = getImageRatio(containerDimensions);
  const imageRatio = getImageRatio(imageDimensions);

  const limitingDimensions = targetRatio < imageRatio ? "width" : "height";

  const resizeRatio =
    limitingDimensions === "width"
      ? containerDimensions.width / imageDimensions.width
      : containerDimensions.height / imageDimensions.height;

  return {
    width:
      limitingDimensions === "width"
        ? containerDimensions.width
        : Math.floor(imageDimensions.width * resizeRatio),
    height:
      limitingDimensions === "height"
        ? containerDimensions.height
        : Math.floor(imageDimensions.height * resizeRatio),
  };
}
