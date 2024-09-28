import { GroupedNftOrdinals } from "@ledgerhq/live-nft-react/index";

export const findCorrespondingSat = (
  inscriptionsGroupedWithRareSats: GroupedNftOrdinals[],
  nftId: string,
) =>
  inscriptionsGroupedWithRareSats.find(
    ({ inscription: groupedInscription }) => groupedInscription.nft_id === nftId,
  );
