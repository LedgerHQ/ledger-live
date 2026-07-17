export class ImageLoadFromGalleryError extends Error {
  override name = "ImageLoadFromGalleryError";
}

export class ImageLoadFromFileError extends Error {
  override name = "ImageLoadFromFileError";
}

export class ImageIncorrectFileTypeError extends Error {
  override name = "ImageIncorrectFileTypeError";
}

export class ImageDownloadError extends Error {
  override name = "ImageDownloadError";
}

export class ImageTooLargeError extends Error {
  override name = "ImageTooLargeError";
}

export class ImageSizeLoadingError extends Error {
  override name = "ImageSizeLoadingError";
}

export class ImageCropError extends Error {
  override name = "ImageCropError";
}

export class ImageResizeError extends Error {
  override name = "ImageResizeError";
}

export class ImagePreviewError extends Error {
  override name = "ImagePreviewError";
}

export class ImageProcessingError extends Error {
  override name = "ImageProcessingError";
}
