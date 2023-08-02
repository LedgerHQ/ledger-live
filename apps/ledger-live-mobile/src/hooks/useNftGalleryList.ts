import { useInfiniteQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { accountAddressesSelector, nftsSelector } from "../reducers/accounts";
import { galleryChainFiltersSelector, gallerySpamFilterSelector } from "../reducers/nft";
import { ProtoNFT } from "@ledgerhq/types-live";
import { useNftAPI } from "@ledgerhq/live-common/nft/NftMetadataProvider/index";

const BASE_PATH = "https://simplehash.api.live.ledger.com/api/v0";
const SPAM_FILTER_THRESHOLD = 80; // Anyt NFT with a likelihood over 80% is filtered out
const PAGE_SIZE = 50;

export const useNftsByWallet = () => {
  const { primeCache } = useNftAPI();
  const addresses = useSelector(accountAddressesSelector);
  const chainFilters = useSelector(galleryChainFiltersSelector);
  const spamFilter = useSelector(gallerySpamFilterSelector);
  const chains = Object.entries(chainFilters)
    .filter(([_, value]) => value)
    .map(([key, _]) => key);
  const protoNfts = useSelector(nftsSelector);

  // TODO: Exclude hidden NFT's when supported by the API.
  const url = `${BASE_PATH}/nfts/owners_v2?chains=${chains.join(
    ",",
  )}&wallet_addresses=${addresses.join(",")}&limit=${PAGE_SIZE}${
    spamFilter ? `&filters=spam_score__lte%3D${SPAM_FILTER_THRESHOLD}` : ""
  }`;

  const result = useInfiniteQuery(
    [url],
    async ({ pageParam }) => {
      const response = await fetch(`${url}${pageParam ? `&cursor=${pageParam}` : ""}`, {
        method: "GET",
      });

      if (response.status !== 200) {
        // TODO: Handle errors. The API returns a 400 when no chains are supplied which
        // is a little annoying as it's not really an error in our use case, only a filter.
        if (response.status !== 400) {
          throw new Error((response as any).message);
        }
        return;
      }

      const result = (await response.json()) as SimpleHashResponse;

      // NOTE: The SH API gives us all the metadata information we need so we could skip using
      // `useNftMetaData` hooks entirely to render the gallery but this would require a refactor as these same components
      // are used elsewhere. Instead we can prime the NFT context with the SimpleHash response to avoid the HTTP request
      // entirely. This is just an idea, but ideally the server which acts as a reverse proxy to SH could massage the
      // "SimpleHashNft" data into the same shape the metadata service returns, so none of this logic is in the client
      // and both API's are returning the same data.
      // In it's current form this is a bit of a hack as we're going to two very different places for the list view and the
      // detail view and they could be using different providers and return different data! If the floor price was also
      // included in the metadata API, we could also remove that request which is not cached.
      result.nfts.forEach(nft => {
        primeCache(
          {
            contract: nft.contract_address,
            tokenId: nft.token_id,
            nftName: nft.name,
            tokenName: nft.collection.name,
            description: nft.description,
            staxImage: nft.extra_metadata?.ledger_metadata?.ledger_stax_image,
            medias: {
              preview: {
                uri: nft.image_url,
                mediaType: "",
              },
              big: {
                uri: nft.image_url,
                mediaType: "",
              },
              original: {
                uri: nft.image_url,
                mediaType: "",
              },
            },
            // TODO: there are more properties that need mapping here but as we have SH as a provider already
            // on the NMS API it would be ideally offloaded to the API and we can fetch an array
            // of NFTMetadataResponse["result"] objects that can be primed easily.
          },
          nft.chain,
        );
      });
      return result;
    },
    {
      keepPreviousData: true,
      cacheTime: 0,
      enabled: !!addresses.length,
      getNextPageParam: lastPage => {
        const cursor = (lastPage || {}).next_cursor;
        return cursor ? cursor : false;
      },
    },
  );

  return {
    ...result,
    // NOTE: Without refactoring EVERYTHING we simply have to map a "SimpleHashNft" into
    // a "ProtoNFT" and then let the app behave exactly as before. We are currently doing this
    // by looking up the NFT from SimpleHash in our account object and then using that ProtoNFT to render.
    // We need to do this because SimpleHash doesn't know anything about our account object but the
    // whole UI relies on knowing what account owns the NFT in order to hide/transact an NFT.
    // This is far from ideal because merging an API with some local state like this is
    // prone to errors and discrepancies, especially if they get out of sync (which they will) because
    // the UI won't truly reflect the page requested from the API i.e request a page of 10, account object may
    // only have 5, so we show 5. This is fine for now as the gallery loads infinitely but it's fragile.
    parsedData:
      result.data?.pages
        .flatMap(x => x?.nfts || [])
        .reduce<ProtoNFT[]>((p, c) => {
          const nfts = protoNfts.filter(
            protoNft =>
              // Is this check good enough to denote an NFT match?
              protoNft.contract === c.contract_address &&
              protoNft.standard === c.contract.type &&
              protoNft.currencyId === c.chain &&
              protoNft.tokenId === c.token_id,
          );
          if (nfts) {
            p.push(...nfts);
          }
          return p;
        }, []) || [],
  };
};

// NOTE: Ideally SimpleHash would define their OpenAPI schema to contain definitions so
// we can generate a fully typed SDK instead having everything untyped
// or manually typed as below. For now I've just defined the properties I need.
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
