export class ImageLoadFromGalleryError extends Error {
  override name = "ImageLoadFromGalleryError";
  constructor(message = "ImageLoadFromGalleryError") {
    super(message);
  }
}

export class ImageLoadFromFileError extends Error {
  override name = "ImageLoadFromFileError";
  constructor(message = "ImageLoadFromFileError") {
    super(message);
  }
}

export class ImageIncorrectFileTypeError extends Error {
  override name = "ImageIncorrectFileTypeError";
  constructor(message = "ImageIncorrectFileTypeError") {
    super(message);
  }
}

export class ImageDownloadError extends Error {
  override name = "ImageDownloadError";
  constructor(message = "ImageDownloadError") {
    super(message);
  }
}

export class ImageTooLargeError extends Error {
  override name = "ImageTooLargeError";
  constructor(message = "ImageTooLargeError") {
    super(message);
  }
}

export class ImageSizeLoadingError extends Error {
  override name = "ImageSizeLoadingError";
  constructor(message = "ImageSizeLoadingError") {
    super(message);
  }
}

export class ImageCropError extends Error {
  override name = "ImageCropError";
  constructor(message = "ImageCropError") {
    super(message);
  }
}

export class ImageResizeError extends Error {
  override name = "ImageResizeError";
  constructor(message = "ImageResizeError") {
    super(message);
  }
}

export class ImagePreviewError extends Error {
  override name = "ImagePreviewError";
  constructor(message = "ImagePreviewError") {
    super(message);
  }
}

export class ImageProcessingError extends Error {
  override name = "ImageProcessingError";
  constructor(message = "ImageProcessingError") {
    super(message);
  }
}
