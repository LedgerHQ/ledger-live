import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { createRareSatObject, matchCorrespondingIcon } from "../helpers";

export function getInscriptionsData(
  inscriptions: SimpleHashNft[],
  onInscriptionClick: (inscription: SimpleHashNft) => void,
) {
  return inscriptions.map(item => ({
    tokenName: item.name || item.contract.name || "",
    nftId: item.nft_id,
    collectionName: item.collection.name,
    media: {
      uri: item.image_url || item.previews?.image_small_url,
      isLoading: false,
      useFallback: true,
      contentType: item.extra_metadata?.ordinal_details?.content_type,
      mediaType: "image",
    },
    onClick: () => onInscriptionClick(item),
  }));
}

export function processRareSat(inscription: SimpleHashNft) {
  const matchedRareSatsIcons = matchCorrespondingIcon(inscription);
  const rareSatObject = createRareSatObject({ rareSat: matchedRareSatsIcons });
  return rareSatObject.rareSat[0];
}
