import { ProtoNFT } from "@ledgerhq/types-live";
import { useMemo } from "react";
import { useInfiniteQuery } from "react-query";

import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
interface SimpleHashResponse {
  readonly next_cursor: string | null;
  readonly nfts: SimpleHashNft[];
}
export interface SimpleHashNft {
  readonly nft_id: string;
  readonly chain: string;
  readonly contract_address: string;
  readonly token_id: string;
  readonly image_url: string;
  readonly name: string;
  readonly description: string;
  readonly token_count: number;
  readonly collection: {
    readonly name: string;
  };
  readonly contract: {
    readonly type: string;
  };
  readonly extra_metadata?: {
    readonly ledger_metadata?: {
      readonly ledger_stax_image: string;
    };
    readonly image_original_url: string;
    readonly animation_original_url: string;
  };
}

type Props = {
  addresses: string[];
  nftsOwned: ProtoNFT[];
  chains: string[];
};

const SPAM_FILTER = true;
const BASE_PATH = "https://simplehash.api.live.ledger.com/api/v0";
const SPAM_FILTER_THRESHOLD = 80;
const PAGE_SIZE = 50;

type PartialProtoNFT = Partial<ProtoNFT>;

function mapAsPartialProtoNft(nfts: Array<SimpleHashNft>) {
  return nfts.map(
    nft =>
      ({
        contract: nft.contract_address,
        tokenId: nft.token_id,
        currencyId: nft.chain,
      }) as PartialProtoNFT,
  );
}

export function useNftGallery({ addresses, nftsOwned, chains }: Props) {
  const nftsWithProperties = useMemo(
    () =>
      new Map(
        nftsOwned.map(obj => [encodeNftId("", obj.contract, obj.tokenId, obj.currencyId), obj]),
      ),
    [nftsOwned],
  );

  const url = useMemo(
    () =>
      `${BASE_PATH}/nfts/owners_v2?chains=${chains.join(",")}&wallet_addresses=${addresses.join(
        ",",
      )}&limit=${PAGE_SIZE}${
        SPAM_FILTER ? `&filters=spam_score__lte%3D${SPAM_FILTER_THRESHOLD}` : ""
      }`,
    [addresses, chains],
  );

  const queryResult = useInfiniteQuery(
    [url],
    async ({ pageParam }) => {
      const response = await fetch(`${url}${pageParam ? `&cursor=${pageParam}` : ""}`, {
        method: "GET",
      });

      if (response.status !== 200) {
        // TODO: Handle errors. The API returns a 400 when no chains are supplied which
        // is a little annoying as it's not really an error in our use case, only a filter.
        if (response.status !== 400) {
          throw new Error(response.statusText);
        }
        return;
      }

      const result = (await response.json()) as SimpleHashResponse;
      const res = mapAsPartialProtoNft(result.nfts);

      return { ...result, whiteList: res };
    },
    {
      enabled: !!addresses.length,
      getNextPageParam: lastPage => {
        const cursor = (lastPage || {}).next_cursor;
        return cursor ? cursor : false;
      },
    },
  );

  return {
    ...queryResult,

    parsedData:
      queryResult.data?.pages
        .flatMap(x => x?.whiteList || [])
        .map(elem =>
          nftsWithProperties.get(
            encodeNftId("", elem.contract ?? "", elem.tokenId ?? "", elem.currencyId ?? ""),
          ),
        )
        .filter(elem => !!elem) ?? [],
  };
}
