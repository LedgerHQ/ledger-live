import { createCustomErrorClass } from "@ledgerhq/errors";

export const ImageLoadFromGalleryError = createCustomErrorClass("ImageLoadFromGalleryError");

export const ImageLoadFromFileError = createCustomErrorClass("ImageLoadFromFileError");

export const ImageLoadFromNftError = createCustomErrorClass("ImageLoadFromNftError");

export const ImageIncorrectFileTypeError = createCustomErrorClass("ImageIncorrectFileTypeError");

export const ImageDownloadError = createCustomErrorClass("ImageDownloadError");

export const ImageTooLargeError = createCustomErrorClass("ImageTooLargeError");

export const NFTMetadataLoadingError = createCustomErrorClass("NFTMetadataLoadingError");

export const ImageSizeLoadingError = createCustomErrorClass("ImageSizeLoadingError");

export const ImageCropError = createCustomErrorClass("ImageCropError");

export const ImageResizeError = createCustomErrorClass("ImageResizeError");

export const ImagePreviewError = createCustomErrorClass("ImagePreviewError");

export const ImageProcessingError = createCustomErrorClass("ImageProcessingError");
