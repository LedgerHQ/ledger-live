import { fetchNftsFromSimpleHashById } from "@ledgerhq/live-nft/api/simplehash";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { OrdinalsChainsEnum } from "./types";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { NFTS_QUERY_KEY } from "../queryKeys";

export const useFetchOrdinalByTokenId = (
  contractAddress: string,
): UseQueryResult<SimpleHashNft, Error> => {
  const chain = [OrdinalsChainsEnum.INSCRIPTIONS];
  const tokenId = "0";
  return useQuery({
    queryKey: [NFTS_QUERY_KEY.FectchOrdinalsByTokenId, contractAddress, chain, tokenId],
    queryFn: () =>
      fetchNftsFromSimpleHashById({
        chains: chain,
        contract_address: contractAddress,
        token_id: tokenId,
      }),
  });
};
