import { Image } from "react-native";
import * as ImagePicker from "react-native-image-picker";
import {
  ImageLoadFromGalleryError,
  ImageSizeLoadingError,
  ImageTooLargeError,
} from "@ledgerhq/live-common/customImage/errors";
import { ImageDimensions, ImageFileUri } from "./types";

/**
 * Call this to prompt the user to pick an image from its phone.
 *
 * @returns (a promise) null if the user cancelled, otherwise an object
 * containing the chosen image file URI as well as the image dimensions
 */
export async function importImageFromPhoneGallery(): Promise<ImageFileUri | null> {
  try {
    const pickImagePromise = ImagePicker.launchImageLibrary({
      mediaType: "photo",
      quality: 1,
      includeBase64: false,
      selectionLimit: 1,
    })
      .then(res => {
        if (res.errorCode)
          throw new Error(
            `ImagePicker.launchImageLibrary Error (error code: ${res.errorCode}): ${res.errorMessage}`,
          );
        const assets = res?.assets || [];
        if (assets.length === 0 && !res.didCancel) throw new Error("Assets length is 0");
        return {
          cancelled: res.didCancel,
          uri: assets[0]?.uri,
        };
      })
      .catch(err => {
        throw err;
      });
    const { uri, cancelled } = await pickImagePromise;
    if (cancelled) return null;
    if (uri) {
      return {
        imageFileUri: uri,
      };
    }
    throw new Error("uri is falsy");
  } catch (e) {
    console.error(e);
    throw new ImageLoadFromGalleryError();
  }
}

export async function loadImageSizeAsync(url: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      url,
      (width, height) => {
        resolve({ width, height });
      },
      error => {
        console.error(error);
        if (error?.message?.startsWith("Pool hard cap violation? ")) {
          reject(new ImageTooLargeError());
        } else {
          reject(new ImageSizeLoadingError());
        }
      },
    );
  });
}

/**
 * @param imageDimensions dimensions of the image to resize
 * @param boxDimensions dimensions of the constraint "box" to fit in
 * @returns new dimensions with the aspect ratio of imageDimensions that fit in boxDimensions
 */
export function fitImageContain(
  imageDimensions: ImageDimensions,
  boxDimensions: ImageDimensions,
): ImageDimensions {
  const { height: imageHeight, width: imageWidth } = imageDimensions;
  const { height: boxHeight, width: boxWidth } = boxDimensions;
  if ([boxHeight, boxWidth, imageHeight, imageWidth].some(val => val === 0)) return boxDimensions;
  if (imageHeight <= boxHeight && imageWidth <= boxWidth)
    return {
      width: imageWidth,
      height: imageHeight,
    };
  if (imageWidth / imageHeight >= boxWidth / boxHeight) {
    /**
     * Width of the box is the biggest constraint (image is wider than the box
     * in terms of aspect ratio)
     *
     * Given this condition, do some basic math on the inequality and we have:
     *
     * (1). imageWidth / imageHeight >= boxWidth / boxHeight    (the inequality in the "if" condition)
     * (2). boxHeight / boxWidth >= imageHeight / imageWidth    (carefully invert (1))
     * (3). boxHeight >= (imageHeight / imageWidth) * boxWidth  (multiply (2) by boxWidth)
     *
     * -> (3) shows that the resulting height (below) is smaller than boxHeight.
     *    so the returned value "fits" in the box.
     *
     * */
    return {
      width: boxWidth,
      height: (imageHeight / imageWidth) * boxWidth,
    };
  }
  /**
   * Height of the box is the biggest constraint
   * */
  return {
    width: (imageWidth / imageHeight) * boxHeight,
    height: boxHeight,
  };
}
