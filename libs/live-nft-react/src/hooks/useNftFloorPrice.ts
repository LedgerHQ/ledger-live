import { useQuery } from "@tanstack/react-query";
import { ProtoNFT } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getFloorPrice } from "@ledgerhq/live-nft/api/metadataservice";
import { NFTS_QUERY_KEY } from "../queryKeys";
import { FloorPriceResult } from "./types";

export const useNftFloorPrice = (
  protoNft: ProtoNFT,
  currency: CryptoCurrency,
): FloorPriceResult => {
  return useQuery({
    queryKey: [NFTS_QUERY_KEY.FloorPrice, protoNft, currency],
    queryFn: () => getFloorPrice(protoNft, currency),
  });
};
