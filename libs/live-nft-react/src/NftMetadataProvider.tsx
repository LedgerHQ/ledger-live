import type {
  NFT,
  NFTCollectionMetadataResponse,
  NFTMetadataResponse,
  ProtoNFT,
  CurrencyBridge,
} from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { getNftCollectionKey, getNftKey, isOutdated } from "@ledgerhq/live-nft";
import {
  NFTMetadataContextAPI,
  NFTMetadataContextState,
  NFTMetadataContextType,
  NFTResource,
  NFTOperations,
} from "@ledgerhq/live-nft/types";

type Item = {
  contract?: string;
  tokenId?: string;
  currencyId?: string;
};

const NftMetadataContext = createContext<NFTMetadataContextType>({
  cache: {},
  loadNFTMetadata: () => Promise.resolve(),
  loadCollectionMetadata: () => Promise.resolve(),
  clearCache: () => {},
});

export function useNftMetadata(
  contract: string | undefined,
  tokenId: string | undefined,
  currencyId: string | undefined,
): NFTResource<NonNullable<NFTMetadataResponse["result"]>> {
  const { cache, loadNFTMetadata } = useContext(NftMetadataContext);
  const key = contract && tokenId && currencyId ? getNftKey(contract, tokenId, currencyId) : "";
  const cachedData = cache[key] as NFTResource<NonNullable<NFTMetadataResponse["result"]>>;

  useEffect(() => {
    if (!contract || !tokenId || !currencyId) return;
    if (!cachedData || isOutdated(cachedData)) {
      loadNFTMetadata(contract, tokenId, currencyId);
    }
  }, [contract, tokenId, cachedData, loadNFTMetadata, currencyId]);

  if (cachedData) {
    return cachedData;
  } else {
    return {
      status: "queued",
    };
  }
}

export function useNftMetadataBatch(
  items: Array<Item>,
): Array<NFTResource<NonNullable<NFTMetadataResponse["result"]>>> {
  const { cache, loadNFTMetadata } = useContext(NftMetadataContext);

  const hasAllProperties = (item: Item): item is Required<Item> =>
    !!item.contract && !!item.tokenId && !!item.currencyId;

  const data = useMemo(
    () =>
      items.map(item => {
        const key = hasAllProperties(item)
          ? getNftKey(item.contract, item.tokenId, item.currencyId)
          : "";
        const cachedData = cache[key] as NFTResource<NonNullable<NFTMetadataResponse["result"]>>;
        return { key, cachedData };
      }),
    [items, cache],
  );

  useEffect(() => {
    data.forEach(({ key, cachedData }) => {
      if (cachedData && !isOutdated(cachedData)) return;
      const item = items.find(
        i => hasAllProperties(i) && getNftKey(i.contract, i.tokenId, i.currencyId) === key,
      );
      if (!item) return;
      hasAllProperties(item) && loadNFTMetadata(item.contract, item.tokenId, item.currencyId);
    });
  }, [items, loadNFTMetadata, cache, data]);

  return items.map(item => {
    const key = hasAllProperties(item)
      ? getNftKey(item.contract, item.tokenId, item.currencyId)
      : "";
    const cachedData = cache[key] as NFTResource<NonNullable<NFTMetadataResponse["result"]>>;
    return cachedData || { status: "queued" };
  });
}

export function useNftCollectionMetadata(
  contract: string | undefined,
  currencyId: string | undefined,
): NFTResource<NonNullable<NFTCollectionMetadataResponse["result"]>> {
  const { cache, loadCollectionMetadata } = useContext(NftMetadataContext);

  const key = contract && currencyId ? getNftCollectionKey(contract, currencyId) : "";

  const cachedData = cache[key] as NFTResource<
    NonNullable<NFTCollectionMetadataResponse["result"]>
  >;

  useEffect(() => {
    if (!contract || !currencyId) return;
    if (!cachedData || isOutdated(cachedData)) {
      loadCollectionMetadata(contract, currencyId);
    }
  }, [contract, cachedData, currencyId, loadCollectionMetadata]);

  if (cachedData) {
    return cachedData;
  } else {
    return {
      status: "queued",
    };
  }
}

export function useNftCollectionMetadataBatch(
  operations: NFTOperations,
): Array<NFTResource<NonNullable<NFTCollectionMetadataResponse["result"]>>> {
  const items = Object.values(operations);
  const { cache, loadCollectionMetadata } = useContext(NftMetadataContext);

  const hasAllProperties = (item: Item): item is Required<Item> =>
    !!item.contract && !!item.currencyId;
  const data = useMemo(
    () =>
      items.map(item => {
        const key = hasAllProperties(item)
          ? getNftCollectionKey(item.contract, item.currencyId)
          : "";
        const cachedData = cache[key] as NFTResource<
          NonNullable<NFTCollectionMetadataResponse["result"]>
        >;
        return { key, cachedData };
      }),
    [items, cache],
  );

  useEffect(() => {
    data.forEach(({ key, cachedData }) => {
      if (cachedData && !isOutdated(cachedData)) return;
      const item = items.find(
        i => hasAllProperties(i) && getNftCollectionKey(i.contract, i.currencyId) === key,
      );
      if (!item) return;
      hasAllProperties(item) && loadCollectionMetadata(item.contract, item.currencyId);
    });
  }, [items, loadCollectionMetadata, cache, data]);

  return useMemo(() => {
    const parsedItems = items.map(item => {
      const key = hasAllProperties(item) ? getNftCollectionKey(item.contract, item.currencyId) : "";
      const cachedData = cache[key] as NFTResource<
        NonNullable<NFTCollectionMetadataResponse["result"]>
      >;
      return cachedData || { status: "queued" };
    });
    return parsedItems;
  }, [items, cache]);
}

type UseNFTResponse =
  | { status: Exclude<NFTResource["status"], "loaded"> }
  | { status: "loaded"; nft: NFT };

export function useNft(protoNft: ProtoNFT): UseNFTResponse {
  const data = useNftMetadata(protoNft.contract, protoNft.tokenId, protoNft.currencyId);

  const { status } = data;
  const metadata = useMemo(() => (status === "loaded" ? data.metadata : null), [data, status]);

  const nft = useMemo(
    () => (status === "loaded" && metadata ? { ...protoNft, metadata } : null),
    [protoNft, metadata, status],
  ) as NFT | null;

  return status !== "loaded"
    ? { status }
    : {
        status,
        nft: nft as NFT,
      };
}

export function useNftAPI(): NFTMetadataContextAPI {
  const { clearCache, loadNFTMetadata, loadCollectionMetadata } = useContext(NftMetadataContext);

  return {
    clearCache,
    loadNFTMetadata,
    loadCollectionMetadata,
  };
}

type NFTMetadataProviderProps = {
  children: React.ReactNode;
  getCurrencyBridge: (currency: CryptoCurrency) => CurrencyBridge;
};

export function NftMetadataProvider({
  children,
  getCurrencyBridge,
}: NFTMetadataProviderProps): React.ReactElement {
  const [state, setState] = useState<NFTMetadataContextState>({
    cache: {},
  });

  const api: NFTMetadataContextAPI = useMemo(
    () => ({
      loadNFTMetadata: async (contract: string, tokenId: string, currencyId: string) => {
        const key = getNftKey(contract, tokenId, currencyId);
        const currency = getCryptoCurrencyById(currencyId);
        const currencyBridge = getCurrencyBridge(currency);

        if (!currencyBridge.nftResolvers?.nftMetadata) {
          throw new Error("Currency doesn't support NFT metadata");
        }

        setState(oldState => ({
          ...oldState,
          cache: {
            ...oldState.cache,
            [key]: {
              status: "loading",
            },
          },
        }));

        try {
          const { status, result } = await currencyBridge.nftResolvers.nftMetadata({
            contract,
            tokenId,
            currencyId: currency.id,
          });

          switch (status) {
            case 500:
              throw new Error("NFT Metadata Provider failed");
            case 404:
              setState(oldState => ({
                ...oldState,
                cache: {
                  ...oldState.cache,
                  [key]: {
                    status: "nodata",
                    metadata: null,
                    updatedAt: Date.now(),
                  },
                },
              }));
              break;
            case 200:
              setState(oldState => ({
                ...oldState,
                cache: {
                  ...oldState.cache,
                  [key]: {
                    status: "loaded",
                    metadata: result,
                    updatedAt: Date.now(),
                  } as NFTResource<NonNullable<NFTMetadataResponse["result"]>>,
                },
              }));
              break;
            default:
              break;
          }
        } catch (_error) {
          // This shenanigan is here to avoid an Hermes bug https://github.com/pmndrs/zustand/discussions/1269
          const error = new Error(_error ? (_error as Error).message : "Unknown Error");

          setState(oldState => ({
            ...oldState,
            cache: {
              ...oldState.cache,
              [key]: {
                status: "error",
                error,
                updatedAt: Date.now(),
              },
            },
          }));
        }
      },

      loadCollectionMetadata: async (contract: string, currencyId: string) => {
        const key = getNftCollectionKey(contract, currencyId);
        const currency = getCryptoCurrencyById(currencyId);
        const currencyBridge = getCurrencyBridge(currency);

        if (!currencyBridge?.nftResolvers?.collectionMetadata) {
          throw new Error("Currency doesn't support Collection Metadata");
        }

        setState(oldState => ({
          ...oldState,
          cache: {
            ...oldState.cache,
            [key]: {
              status: "loading",
            },
          },
        }));

        try {
          const { status, result } = await currencyBridge.nftResolvers.collectionMetadata({
            contract,
            currencyId: currency.id,
          });

          switch (status) {
            case 500:
              throw new Error("NFT Metadata Provider failed");
            case 404:
              setState(oldState => ({
                ...oldState,
                cache: {
                  ...oldState.cache,
                  [key]: {
                    status: "nodata",
                    metadata: null,
                    updatedAt: Date.now(),
                  },
                },
              }));
              break;
            case 200:
              setState(oldState => ({
                ...oldState,
                cache: {
                  ...oldState.cache,
                  [key]: {
                    status: "loaded",
                    metadata: result,
                    updatedAt: Date.now(),
                  } as NFTResource<NonNullable<NFTCollectionMetadataResponse["result"]>>,
                },
              }));
              break;
            default:
              break;
          }
        } catch (_error) {
          // This shenanigan is here to avoid an Hermes bug https://github.com/pmndrs/zustand/discussions/1269
          const error = new Error(_error ? (_error as Error).message : "Unknown Error");

          setState(oldState => ({
            ...oldState,
            cache: {
              ...oldState.cache,
              [key]: {
                status: "error",
                error,
                updatedAt: Date.now(),
              },
            },
          }));
        }
      },
      clearCache: () => {
        setState(oldState => ({
          ...oldState,
          cache: {},
        }));
      },
    }),
    [],
  );

  const value = { ...state, ...api };

  return <NftMetadataContext.Provider value={value}>{children}</NftMetadataContext.Provider>;
}
