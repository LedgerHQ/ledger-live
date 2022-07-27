import { createCustomErrorClass } from "@ledgerhq/errors";

export const ImageLoadFromGalleryError: any = createCustomErrorClass(
  "ImageLoadFromGalleryError",
);

export const ImageDownloadError: any = createCustomErrorClass(
  "ImageDownloadError",
);

export const ImageTooLargeError: any = createCustomErrorClass(
  "ImageTooLargeError",
);

export const ImageMetadataLoadingError: any = createCustomErrorClass(
  "ImageMetadataLoadingError",
);

export const ImageCropError: any = createCustomErrorClass("ImageCropError");

export const ImageResizeError: any = createCustomErrorClass("ImageResizeError");

export const ImagePreviewError: any = createCustomErrorClass(
  "ImagePreviewError",
);

export const ImageProcessingError: any = createCustomErrorClass(
  "ImageProcessingError",
);
