import React, { useCallback, useRef } from "react";
import { Button, Flex } from "@ledgerhq/native-ui";
import { CropView } from "react-native-image-crop-tools";
import styled from "styled-components/native";
import { Image, StyleProp, ViewStyle } from "react-native";
import { ImageCropError } from "@ledgerhq/live-common/customImage/errors";
import { useTranslation } from "react-i18next";
import { ImageDimensions, ImageFileUri } from "./types";

const HiddenImage = styled(Image)`
  height: 0;
  width: 0;
  opacity: 0;
`;

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
    imageFileUri,
    aspectRatio,
    onError,
    onResult,
    withButton = false,
  } = props;

  const cropViewRef = useRef<CropView>(null);
  const { t } = useTranslation();

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

  const handleLoadError = useCallback(() => {
    onError(new ImageCropError());
  }, [onError]);

  const handleSave = useCallback(() => {
    cropViewRef?.current?.saveImage(true, 100);
  }, []);

  return (
    <Flex>
      <HiddenImage source={{ uri: imageFileUri }} onError={handleLoadError} />
      <CropView
        key={imageFileUri}
        sourceUrl={imageFileUri}
        style={style}
        ref={withButton ? cropViewRef : ref}
        onImageCrop={handleImageCrop}
        keepAspectRatio
        aspectRatio={aspectRatio}
      />
      {withButton && (
        <Button type="main" onPress={handleSave}>
          {t("customImage.cropImage")}
        </Button>
      )}
    </Flex>
  );
});

export default ImageCropper;
