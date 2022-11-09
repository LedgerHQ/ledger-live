import { useEffect } from "react";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { ImageResizeError } from "@ledgerhq/live-common/customImage/errors";
import { floor } from "lodash";
import { ImageBase64Data, ImageDimensions, ImageFileUri } from "./types";
import { loadImageSizeAsync } from "./imageUtils";

export type CenteredResult = ImageBase64Data & ImageDimensions;

export type Params = Partial<ImageFileUri> & {
  targetDimensions: ImageDimensions;
  onError: (_: Error) => void;
  onResult: (_: CenteredResult) => void;
};

/**
 * Component to crop an image in the center and resize it.
 *
 * It:
 *  - takes as an input an image file URI & target dimensions as an input
 *  - renders nothing
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
      const realImageDimensions = await loadImageSizeAsync(imageFileUri);

      const imageDimensions = {
        width: realImageDimensions.width / 2,
        height: realImageDimensions.height / 2,
      };

      console.log(imageDimensions);

      const getImageRatio = (dimensions: ImageDimensions) =>
        dimensions.height / dimensions.width;

      const targetRatio = getImageRatio(targetDimensions);
      const imageRatio = getImageRatio(imageDimensions);

      const limitingDimensions = targetRatio < imageRatio ? "width" : "height";

      const cropDimension = {
        width: floor(
          limitingDimensions === "width"
            ? imageDimensions.width
            : (imageDimensions.height * targetDimensions.width) /
                targetDimensions.height,
        ),
        height: floor(
          limitingDimensions === "height"
            ? imageDimensions.height
            : (imageDimensions.width * targetDimensions.height) /
                targetDimensions.width,
        ),
      };

      const cropCoordinates = {
        originX: (imageDimensions.width - cropDimension.width) / 2,
        originY: (imageDimensions.height - cropDimension.height) / 2,
      };

      console.log(cropCoordinates);
      console.log(cropDimension);
      console.log();

      manipulateAsync(
        imageFileUri,
        [
          {
            resize: {
              width: imageDimensions.width,
              height: imageDimensions.height,
            },
          },
          {
            crop: {
              ...cropCoordinates,
              ...cropDimension,
            },
          },
          {
            resize: {
              width: targetDimensions.width,
              height: targetDimensions.height,
            },
          },
        ],
        { base64: true, compress: 1, format: SaveFormat.PNG },
      )
        .then(({ base64, height, width }) => {
          if (dead) return;
          const fullBase64 = `data:image/png;base64, ${base64}`;
          onResult({ imageBase64DataUri: fullBase64, height, width });
        })
        .catch(e => {
          if (dead) return;
          console.error(e);
          onError(new ImageResizeError());
        });
    };
    load();
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
