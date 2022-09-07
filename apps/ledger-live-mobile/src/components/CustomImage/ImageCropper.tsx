import React, { useCallback, useRef } from "react";
import { Button, Flex } from "@ledgerhq/native-ui";
import { CropView } from "react-native-image-crop-tools";
import { StyleProp, ViewStyle } from "react-native";
import { ImageDimensions, ImageFileUri } from "./types";
import { ImageCropError } from "./errors";

export type CropResult = ImageDimensions & ImageFileUri;

export type Props = ImageFileUri & {
  aspectRatio: { width: number; height: number };
  onResult: (_: CropResult) => void;
  onError: (_: Error) => void;
  style?: StyleProp<ViewStyle>;
  withButton?: boolean;
};

/**
 * UI Component to crop an image.
 *
 * It
 *  - takes as "input" an image file URI,
 *  - displays a UI to crop that image
 *  - and on user action (crop confirmation)
 *  - outputs the result of the cropping as a file URI (which will be a new file)
 *
 * To trigger the crop confirmation, either leave the prop `withButton` to true
 * in which case a button will be rendered an handle it,
 * or pass a ref to this component and call `ref.current.saveImage(true, 100)`
 */
const ImageCropper = React.forwardRef<CropView, Props>((props, ref) => {
  const {
    style,
    imageFileUri, // eslint-disable-line react/prop-types
    aspectRatio,
    onError,
    onResult,
    withButton = false,
  } = props;

  const cropViewRef = useRef<CropView>(null);

  const handleImageCrop = useCallback(
    async res => {
      const { height, width, uri: fileUri } = res;
      if (!fileUri) {
        onError(new ImageCropError());
        return;
      }
      onResult({
        width,
        height,
        imageFileUri: fileUri,
      });
    },
    [onError, onResult],
  );

  const handleSave = useCallback(() => {
    cropViewRef?.current?.saveImage(true, 100);
  }, []);

  return (
    <Flex>
      <CropView
        key={imageFileUri}
        sourceUrl={imageFileUri}
        style={style}
        ref={withButton ? cropViewRef : ref}
        onImageCrop={handleImageCrop}
        keepAspectRatio
        aspectRatio={aspectRatio}
        scaleType={1}
      />
      {withButton && (
        <Button type="main" onPress={handleSave}>
          Crop
        </Button>
      )}
    </Flex>
  );
});

export default ImageCropper;
