import { useEffect } from "react";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { ImageResizeError } from "@ledgerhq/live-common/customImage/errors";
import { ImageBase64Data, ImageDimensions, ImageFileUri } from "./types";

export type ResizeResult = ImageBase64Data & ImageDimensions;

export type Params = Partial<ImageFileUri> & {
  targetDimensions: ImageDimensions;
  onError: (_: Error) => void;
  onResult: (_: ResizeResult) => void;
};

/**
 * Hook to resize an image.
 *
 * It:
 *  - takes as an input an image file URI & target dimensions as an input
 *  - outputs the resulting image as a base64 data URI.
 *
 * */

function useResizedImage(params: Params) {
  const { imageFileUri, targetDimensions, onError, onResult } = params;
  useEffect(() => {
    let dead = false;
    if (!imageFileUri)
      return () => {
        dead = true;
      };
    manipulateAsync(
      imageFileUri,
      [
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
    return () => {
      dead = true;
    };
  }, [imageFileUri, targetDimensions?.height, targetDimensions?.width, onError, onResult]);
}

export default useResizedImage;
