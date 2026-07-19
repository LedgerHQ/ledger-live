export class ImageLoadFromGalleryError extends Error {
  override name = "ImageLoadFromGalleryError";
  constructor(message?: string) {
    super(message ?? "ImageLoadFromGalleryError");
  }
}

export class ImageLoadFromFileError extends Error {
  override name = "ImageLoadFromFileError";
  constructor(message?: string) {
    super(message ?? "ImageLoadFromFileError");
  }
}

export class ImageIncorrectFileTypeError extends Error {
  override name = "ImageIncorrectFileTypeError";
  constructor(message?: string) {
    super(message ?? "ImageIncorrectFileTypeError");
  }
}

export class ImageDownloadError extends Error {
  override name = "ImageDownloadError";
  constructor(message?: string) {
    super(message ?? "ImageDownloadError");
  }
}

export class ImageTooLargeError extends Error {
  override name = "ImageTooLargeError";
  constructor(message?: string) {
    super(message ?? "ImageTooLargeError");
  }
}

export class ImageSizeLoadingError extends Error {
  override name = "ImageSizeLoadingError";
  constructor(message?: string) {
    super(message ?? "ImageSizeLoadingError");
  }
}

export class ImageCropError extends Error {
  override name = "ImageCropError";
  constructor(message?: string) {
    super(message ?? "ImageCropError");
  }
}

export class ImageResizeError extends Error {
  override name = "ImageResizeError";
  constructor(message?: string) {
    super(message ?? "ImageResizeError");
  }
}

export class ImagePreviewError extends Error {
  override name = "ImagePreviewError";
  constructor(message?: string) {
    super(message ?? "ImagePreviewError");
  }
}

export class ImageProcessingError extends Error {
  override name = "ImageProcessingError";
  constructor(message?: string) {
    super(message ?? "ImageProcessingError");
  }
}
