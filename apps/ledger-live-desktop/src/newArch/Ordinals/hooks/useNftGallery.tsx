import { useMemo } from "react";
import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult } from "@tanstack/react-query";
import { fetchNftsFromSimpleHash } from "@ledgerhq/live-nft/api/simplehash";
import { Ordinal, OrdinalContract, OrdinalMetadata, OrdinalStandard } from "../types/Ordinals";
import { SimpleHashResponse } from "@ledgerhq/live-nft/api/types";

export type HookProps = {
  addresses: string;
  standard: OrdinalStandard;
  threshold?: number;
};

export type NftGalleryResult = UseInfiniteQueryResult<
  InfiniteData<SimpleHashResponse, unknown>,
  Error
> & {
  nfts: Ordinal[];
};

/**
 * useNftGalleryFilter() will apply a spam filtering on top of existing NFT data.
 * - addresses: a list of wallet addresses separated by a ","
 * - nftOwned: the array of all nfts as found by all user's account on Ledger Live
 * - chains: a list of selected network to search for NFTs
 * NB: for performance, make sure that addresses, nftOwned and chains are memoized
 */
export function useNftGallery({ addresses, standard, threshold }: HookProps): NftGalleryResult {
  const chains = standard === "inscriptions" ? ["bitcoin"] : ["utxo"];
  const queryResult = useInfiniteQuery({
    queryKey: [addresses, chains],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchNftsFromSimpleHash({
        addresses,
        chains,
        cursor: pageParam,
        threshold,
      }),
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.next_cursor,
    enabled: addresses.length > 0,
  });

  console.log("QUERY RESULT");
  console.log(queryResult.data);

  const out = useMemo(() => {
    const nfts: Ordinal[] = [];
    if (queryResult.data) {
      for (const page of queryResult.data.pages) {
        for (const nft of page.nfts) {
          const n: Ordinal = {
            id: nft.nft_id,
            name: nft.name,
            amount: nft.token_count,
            contract: nft.contract as OrdinalContract,
            contract_address: nft.contract_address,
            standard: "inscriptions",
            metadata: nft.extra_metadata as unknown as OrdinalMetadata,
          };
          nfts.push(n);
        }
      }
    }
    return { ...queryResult, nfts };
  }, [queryResult]);

  return out;
}
