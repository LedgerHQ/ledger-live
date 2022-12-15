import { useEffect } from "react";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import {
  ImageCropError,
  ImageMetadataLoadingError,
  ImageResizeError,
} from "@ledgerhq/live-common/customImage/errors";
import { ImageBase64Data, ImageDimensions, ImageFileUri } from "./types";
import { loadImageSizeAsync } from "./imageUtils";

export type CenteredResult = ImageBase64Data & ImageDimensions;

export type Params = Partial<ImageFileUri> & {
  targetDimensions: ImageDimensions;
  onError: (_: Error) => void;
  onResult: (_: CenteredResult) => void;
};

/**
 * Hook to crop an image in the center and resize it.
 *
 * It:
 *  - takes as an input an image file URI & target dimensions as an input
 *  - outputs the resulting image as a base64 data URI.
 *
 * */

function useCenteredImage(params: Params) {
  const { imageFileUri, targetDimensions, onError, onResult } = params;
  useEffect(() => {
    let dead = false;
    if (!imageFileUri)
      return () => {
        dead = true;
      };

    const load = async () => {
      const realImageDimensions = await loadImageSizeAsync(imageFileUri).catch(
        e => {
          console.error(e);
          throw new ImageMetadataLoadingError();
        },
      );

      const imageDimensions = {
        width: realImageDimensions.width / 2,
        height: realImageDimensions.height / 2,
      };

      const getImageRatio = (dimensions: ImageDimensions) =>
        dimensions.height / dimensions.width;

      const targetRatio = getImageRatio(targetDimensions);
      const imageRatio = getImageRatio(imageDimensions);

      const limitingDimensions = targetRatio < imageRatio ? "width" : "height";

      const resizeRatio =
        limitingDimensions === "width"
          ? targetDimensions.width / imageDimensions.width
          : targetDimensions.height / imageDimensions.height;

      const resizedImageDimensions = {
        width: Math.floor(imageDimensions.width * resizeRatio),
        height: Math.floor(imageDimensions.height * resizeRatio),
      };

      const cropParams = {
        ...targetDimensions,
        originX: Math.abs(
          Math.floor(
            (targetDimensions.width - resizedImageDimensions.width) / 2,
          ),
        ),
        originY: Math.abs(
          Math.floor(
            (targetDimensions.height - resizedImageDimensions.height) / 2,
          ),
        ),
      };

      if (dead) return;
      manipulateAsync(imageFileUri, [{ resize: resizedImageDimensions }], {
        compress: 1,
        base64: false,
        format: SaveFormat.PNG,
      })
        .catch(e => {
          console.error(e);
          throw new ImageResizeError();
        })
        .then(resizedImage => {
          if (dead) throw new Error("dead hook"); // this error allows to break the promise chain and will be ignored in the load().catch()
          return manipulateAsync(
            resizedImage?.uri,
            [
              {
                crop: cropParams,
              },
            ],
            { base64: true, compress: 1, format: SaveFormat.PNG },
          );
        })
        .catch(e => {
          if (dead) throw new Error("dead hook");
          console.error(e);
          throw new ImageCropError();
        })
        .then(({ base64, height, width }) => {
          if (dead) return;
          const fullBase64 = `data:image/png;base64, ${base64}`;
          onResult({ imageBase64DataUri: fullBase64, height, width });
        });
    };
    load().catch(e => {
      if (dead) return;
      onError(e);
    });
    return () => {
      dead = true;
    };
  }, [
    imageFileUri,
    targetDimensions?.height,
    targetDimensions?.width,
    onError,
    onResult,
    targetDimensions,
  ]);
}

export default useCenteredImage;
