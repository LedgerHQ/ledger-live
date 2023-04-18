import { NFTMetadata, NFTMediaSize, NFTMedias } from "@ledgerhq/types-live";
const mimeTypesMap = {
  video: ["video/mp4", "video/webm", "video/ogg"],
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
};
const mimeTypesCategories = Object.keys(mimeTypesMap) as (keyof typeof mimeTypesMap)[];
export const getMetadataMediaType = (
  metadata: NFTMetadata,
  mediaFormat: keyof NFTMedias = "preview",
): keyof typeof mimeTypesMap | void => {
  const { mediaType } = metadata?.medias?.[mediaFormat] || {};
  return mimeTypesCategories.find(type => mimeTypesMap[type].includes(mediaType));
};
export const getMetadataMediaTypes = (metadata: NFTMetadata) => {
  const sizes: Array<NFTMediaSize> = ["preview", "big", "original"];
  const sizeToTypeMap = sizes.map(size => [size, getMetadataMediaType(metadata, size)]);
  return Object.fromEntries(sizeToTypeMap);
};
