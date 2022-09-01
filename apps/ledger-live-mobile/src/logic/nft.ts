import { NFTMetadata, NFTMediaSize } from "@ledgerhq/types-live";

const mimeTypesMap = {
  video: ["video/mp4", "video/webm", "video/ogg"],
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
};
const mimeTypesCategories = Object.keys(mimeTypesMap) as Array<
  keyof typeof mimeTypesMap
>;

export const getMetadataMediaType = (
  metadata?: NFTMetadata | null,
  mediaFormat: NFTMediaSize = "preview",
): keyof typeof mimeTypesMap | undefined => {
  const { mediaType } = metadata?.medias?.[mediaFormat] || {};
  if (!mediaType) return undefined;
  return mimeTypesCategories.find(type =>
    mimeTypesMap[type].includes(mediaType),
  );
};

export const getMetadataMediaTypes = (
  metadata: NFTMetadata,
): Record<NFTMediaSize, keyof typeof mimeTypesMap | undefined> => {
  const sizes: NFTMediaSize[] = ["preview", "big", "original"];
  const sizeToTypeMap = sizes.map(size => [
    size,
    getMetadataMediaType(metadata, size),
  ]);
  return Object.fromEntries(sizeToTypeMap) as Record<
    NFTMediaSize,
    keyof typeof mimeTypesMap | undefined
  >;
};
