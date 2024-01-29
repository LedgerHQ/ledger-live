import { useMemo } from "react";
import { useInfiniteQuery, UseInfiniteQueryResult } from "@tanstack/react-query";
import { fetchNftsFromSimpleHash } from "@ledgerhq/live-nft/api/index";
import { SimpleHashResponse } from "@ledgerhq/live-nft/api/types";
import { HookProps } from "./types";
import { ProtoNFT } from "@ledgerhq/types-live";

function hashProtoNFT(contract: string, tokenId: string, currencyId: string): string {
  return `${contract}|${tokenId}|${currencyId}`;
}

type NftGalleryFilterResult = UseInfiniteQueryResult<SimpleHashResponse, unknown> & {
  nfts: ProtoNFT[];
};

/**
 * useNftGallaryFiltering() will apply a spam filtering on top of existing data
 * - addresses: a list of wallet addresses separated by a ","
 * - nftOwned: the array of all nfts as found by all user's account on Ledger Live
 * - chains: a list of selected network to search for NFTs
 * NB: for performance, make sure that addresses, nftOwned and chains are memoized
 */
export function useNftGalleryFilter({
  addresses,
  nftsOwned,
  chains,
}: HookProps): NftGalleryFilterResult {
  const queryResult = useInfiniteQuery({
    queryKey: [addresses, chains],
    queryFn: ({ pageParam }) => fetchNftsFromSimpleHash({ addresses, chains, cursor: pageParam }),
    getNextPageParam: lastPage => lastPage?.next_cursor || false,
    enabled: !!addresses.length,
    initialPageParam: undefined,
  });

  // for performance, we hashmap the list of nfts by hash.
  const nftsWithProperties = useMemo(
    () =>
      new Map(nftsOwned.map(obj => [hashProtoNFT(obj.contract, obj.tokenId, obj.currencyId), obj])),
    [nftsOwned],
  );

  const out = useMemo(
    () => ({
      ...queryResult,
      nfts:
        (queryResult.data?.pages
          .flatMap(x => x?.nfts || [])
          .map(elem =>
            nftsWithProperties.get(
              hashProtoNFT(elem.contract_address ?? "", elem.token_id ?? "", elem.chain ?? ""),
            ),
          )
          .filter(Boolean) as ProtoNFT[]) || [],
    }),
    [queryResult, nftsWithProperties],
  );

  return out;
}
