import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchNftsFromSimpleHash } from "@ledgerhq/live-nft/api/simplehash";
import { ProtoNFT } from "@ledgerhq/types-live";
import { NFTS_QUERY_KEY } from "../queryKeys";
import { NftGalleryFilterResult, HookProps } from "./types";
import { hashProtoNFT } from "./helpers";

/**
 * useNftGalleryFilter() will apply a spam filtering on top of existing NFT data.
 * - addresses: a list of wallet addresses separated by a ","
 * - nftOwned: the array of all nfts as found by all user's account on Ledger Live
 * - chains: a list of selected network to search for NFTs
 * NB: for performance, make sure that addresses, nftOwned and chains are memoized
 */
export function useNftGalleryFilter({
  addresses,
  nftsOwned,
  chains,
  threshold,
}: HookProps): NftGalleryFilterResult {
  const queryResult = useInfiniteQuery({
    queryKey: [NFTS_QUERY_KEY.SpamFilter, addresses, chains],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchNftsFromSimpleHash({ addresses, chains, cursor: pageParam, threshold }),
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.next_cursor,
    enabled: addresses.length > 0,
  });

  // for performance, we hashmap the list of nfts by hash.
  const nftsWithProperties = useMemo(
    () =>
      new Map(nftsOwned.map(obj => [hashProtoNFT(obj.contract, obj.tokenId, obj.currencyId), obj])),
    [nftsOwned],
  );

  const out = useMemo(() => {
    const nfts: ProtoNFT[] = [];
    if (queryResult.data) {
      for (const page of queryResult.data.pages) {
        for (const nft of page.nfts) {
          const hash = hashProtoNFT(nft.contract_address, nft.token_id, nft.chain);
          const existing = nftsWithProperties.get(hash);
          if (existing) {
            nfts.push(existing);
          }
        }
      }
    }
    return { ...queryResult, nfts };
  }, [queryResult, nftsWithProperties]);

  return out;
}
