import { NFTMetadata, NFTMediaSize } from "@ledgerhq/types-live";

const mimeTypesMap = {
  video: ["video/mp4", "video/webm", "video/ogg"],
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
};
const mimeTypesCategories = Object.keys(mimeTypesMap) as Array<
  keyof typeof mimeTypesMap
>;

export const getMetadataMediaType = (
  metadata: NFTMetadata,
  mediaFormat: NFTMediaSize = "preview",
): keyof typeof mimeTypesMap | undefined => {
  const { mediaType } = metadata?.medias?.[mediaFormat] || {};
  return mimeTypesCategories.find(type =>
    mimeTypesMap[type].includes(mediaType),
  );
};
