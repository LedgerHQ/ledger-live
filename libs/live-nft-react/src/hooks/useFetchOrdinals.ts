import { useEffect, useMemo } from "react";
import { fetchNftsFromSimpleHash } from "@ledgerhq/live-nft/api/simplehash";
import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult } from "@tanstack/react-query";
import { SimpleHashResponse, SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { FetchNftsProps, OrdinalsChainsEnum } from "./types";
import { NFTS_QUERY_KEY } from "../queryKeys";
import { processOrdinals } from "./helpers/ordinals";

export interface GroupedNftOrdinals {
  rareSat: SimpleHashNft;
  inscription: SimpleHashNft;
}

export type Result = UseInfiniteQueryResult<InfiniteData<SimpleHashResponse, unknown>, Error> & {
  rareSats: SimpleHashNft[];
  inscriptions: SimpleHashNft[];
  inscriptionsGroupedWithRareSats: GroupedNftOrdinals[];
};

export function useFetchOrdinals({ addresses, threshold }: FetchNftsProps): Result {
  const chains = [OrdinalsChainsEnum.INSCRIPTIONS, OrdinalsChainsEnum.RARESATS];
  const addressString = Array.isArray(addresses) ? addresses.join(",") : addresses;
  const queryResult = useInfiniteQuery({
    queryKey: [NFTS_QUERY_KEY.FetchOrdinals, addresses, chains],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchNftsFromSimpleHash({
        addresses: addressString,
        chains,
        cursor: pageParam,
        threshold,
      }),
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.next_cursor,
    enabled: addresses.length > 0,
  });

  const nfts = useMemo(
    () => queryResult.data?.pages.flatMap(page => page.nfts) ?? [],
    [queryResult.data],
  );

  const { rareSats, inscriptions } = useMemo(() => processOrdinals(nfts), [nfts]);

  const inscriptionsGroupedWithRareSats: GroupedNftOrdinals[] = [];

  rareSats.forEach(sat => {
    const inscription = inscriptions.find(inscription => {
      const location = inscription.extra_metadata?.ordinal_details?.location?.split(":")[0];
      return location === sat.contract_address;
    });
    if (inscription) {
      inscriptionsGroupedWithRareSats.push({ rareSat: sat, inscription });
    }
  });

  useEffect(() => {
    if (queryResult.hasNextPage && !queryResult.isFetchingNextPage) {
      queryResult.fetchNextPage();
    }
  }, [queryResult, queryResult.hasNextPage, queryResult.isFetchingNextPage]);

  return {
    ...queryResult,
    rareSats,
    inscriptions,
    inscriptionsGroupedWithRareSats,
  };
}
