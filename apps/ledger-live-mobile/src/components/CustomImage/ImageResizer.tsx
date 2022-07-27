import { useEffect } from "react";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { ImageBase64Data, ImageDimensions, ImageFileUri } from "./types";
import { ImageResizeError } from "./errors";

export type ResizeResult = ImageBase64Data & ImageDimensions;

export type Props = ImageFileUri & {
  targetDimensions: ImageDimensions;
  onError: (error: Error) => void;
  onResult: (res: ResizeResult) => void;
};

/**
 * Component to resize an image.
 *
 * It:
 *  - takes as an input an image file URI & target dimensions as an input
 *  - renders nothing
 *  - outputs the resulting image as a base64 data URI.
 *
 * */
const ImageResizer: React.FC<Props> = props => {
  const { imageFileUri, targetDimensions, onError, onResult } = props;

  useEffect(() => {
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
        const fullBase64 = `data:image/png;base64, ${base64}`;
        onResult({ imageBase64DataUri: fullBase64, height, width });
      })
      .catch(e => {
        console.error(e);
        onError(new ImageResizeError());
      });
  }, [
    imageFileUri,
    targetDimensions?.height,
    targetDimensions?.width,
    onError,
    onResult,
  ]);

  return null;
};

export default ImageResizer;
