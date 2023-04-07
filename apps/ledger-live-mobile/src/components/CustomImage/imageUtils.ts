import { Image, NativeModules, Platform } from "react-native";
import RNFetchBlob from "rn-fetch-blob";
import * as ImagePicker from "react-native-image-picker";
import {
  ImageDownloadError,
  ImageLoadFromGalleryError,
  ImageMetadataLoadingError,
  ImageTooLargeError,
} from "@ledgerhq/live-common/customImage/errors";
import { NFTMediaSize, NFTMetadata } from "@ledgerhq/types-live";
import { ImageDimensions, ImageFileUri, ImageUrl } from "./types";
import { getMetadataMediaTypes } from "../../logic/nft";

/**
 * Call this to prompt the user to pick an image from its phone.
 *
 * @returns (a promise) null if the user cancelled, otherwise an object
 * containing the chosen image file URI as well as the image dimensions
 */
export async function importImageFromPhoneGallery(): Promise<ImageFileUri | null> {
  try {
    /**
     * We have our own implementation for Android because expo-image-picker
     * sometimes returns {cancelled: true} even when the user picks an image.
     * More specifically, this happens if the user navigates to another app
     * from the opened file picker app.
     * */
    const pickImagePromise =
      Platform.OS === "android"
        ? NativeModules.ImagePickerModule.pickImage()
        : ImagePicker.launchImageLibrary({
            mediaType: "photo",
            quality: 1,
            includeBase64: false,
          }).then(res => {
            if (res.errorCode)
              throw new Error(
                `ImagePicker.launchImageLibrary Error (error code: ${res.errorCode}): ${res.errorMessage}`,
              );
            const assets = res?.assets || [];
            if (assets.length === 0 && !res.didCancel)
              throw new Error("Assets length is 0");
            return {
              cancelled: res.didCancel,
              uri: assets[0]?.uri,
            };
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

export function extractImageUrlFromNftMetadata(
  nftMetadata?: NFTMetadata,
): string | null {
  if (nftMetadata?.staxImage) {
    return nftMetadata?.staxImage;
  }

  const nftMediaTypes = nftMetadata ? getMetadataMediaTypes(nftMetadata) : null;
  const nftMediaSize = nftMediaTypes
    ? (["big", "preview"] as NFTMediaSize[]).find(
        size => nftMediaTypes[size] === "image",
      )
    : null;
  const nftImageUri = nftMediaSize && nftMetadata?.medias?.[nftMediaSize]?.uri;

  return nftImageUri || null;
}

type CancellablePromise<T> = {
  cancel: () => void;
  resultPromise: Promise<T>;
};

export function downloadImageToFile({
  imageUrl,
}: ImageUrl): CancellablePromise<ImageFileUri> {
  const downloadTask = RNFetchBlob.config({ fileCache: true }).fetch(
    "GET",
    imageUrl,
  );
  return {
    resultPromise: downloadTask
      .then(res => ({ imageFileUri: "file://" + res.path() }))
      .catch(e => {
        if (e.message === "canceled") throw e;
        throw new ImageDownloadError();
      }),
    cancel: downloadTask.cancel,
  };
}

export function downloadImageToFileWithDimensions(
  source: ImageUrl,
): CancellablePromise<ImageFileUri & Partial<ImageDimensions>> {
  const { imageUrl } = source;
  const { resultPromise, cancel } = downloadImageToFile({
    imageUrl,
  });
  return {
    resultPromise: Promise.all([loadImageSizeAsync(imageUrl), resultPromise])
      .then(([dims, { imageFileUri }]) => ({
        width: dims.width,
        height: dims.height,
        imageFileUri,
      }))
      .catch(e => {
        cancel();
        throw e;
      }),
    cancel,
  };
}

export async function loadImageSizeAsync(
  url: string,
): Promise<ImageDimensions> {
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
          reject(new ImageMetadataLoadingError());
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
  if ([boxHeight, boxWidth, imageHeight, imageWidth].some(val => val === 0))
    return boxDimensions;
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

export function scaleDimensions(dimensions: ImageDimensions, scale: number) {
  return {
    width: dimensions.width * scale,
    height: dimensions.height * scale,
  };
}
