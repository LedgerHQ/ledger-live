import { useNftMetadata } from "@ledgerhq/live-common/nft/index";

export type ImageType = "staxEnabledImage" | "originalNFTImage" | "customImage";

export type ImageDimensions = {
  /** pixel height of the image */
  height: number;
  /** pixel width of the image */
  width: number;
};

export type ImageBase64Data = {
  /**
   * Image data contained in a base 64 data URI scheme like that:
   *  "data:[<media type>],[;base64],<data>"
   * As defined in RFC 2397 https://datatracker.ietf.org/doc/html/rfc2397
   */
  imageBase64DataUri: string;
};

export type ImageFileUri = {
  /**
   * Image file URI locating an image file on the device.
   * e.g "file://the_image_path
   */
  imageFileUri: string;
};

export type ImageUrl = {
  /**
   * Image URL locating an image on the internet.
   * e.g: "https://example.com/an_image.png"
   */
  imageUrl: string;
};

export type GalleryNFT = {
  /**
   * NFT parameters that can be used to get its metadata using useNftMetadata
   */
  nftMetadataParams: Parameters<typeof useNftMetadata>;
};
