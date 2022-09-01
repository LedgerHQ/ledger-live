import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { getNftCollectionKey, getNftKey } from "../helpers";
import {
  NFTMetadataContextAPI,
  NFTMetadataContextState,
  NFTMetadataContextType,
  NFTResource,
} from "./types";
import { isOutdated } from "./logic";
import { getCurrencyBridge } from "../../bridge";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { NFT, ProtoNFT } from "@ledgerhq/types-live";

const NftMetadataContext = createContext<NFTMetadataContextType>({
  cache: {},
  loadNFTMetadata: () => Promise.resolve(),
  loadCollectionMetadata: () => Promise.resolve(),
  clearCache: () => {},
});

export function useNftMetadata(
  contract: string | undefined,
  tokenId: string | undefined,
  currencyId: string | undefined
): NFTResource {
  const { cache, loadNFTMetadata } = useContext(NftMetadataContext);
  const key =
    contract && tokenId && currencyId
      ? getNftKey(contract, tokenId, currencyId)
      : "";
  const cachedData = cache[key];

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

export function useNftCollectionMetadata(
  contract: string | undefined,
  currencyId: string | undefined
): NFTResource {
  const { cache, loadCollectionMetadata } = useContext(NftMetadataContext);
  const key =
    contract && currencyId ? getNftCollectionKey(contract, currencyId) : "";

  const cachedData = cache[key];

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

type UseNFTResponse =
  | { status: Exclude<NFTResource["status"], "loaded"> }
  | { status: "loaded"; nft: NFT };

export function useNft(protoNft: ProtoNFT): UseNFTResponse {
  const data = useNftMetadata(
    protoNft.contract,
    protoNft.tokenId,
    protoNft.currencyId
  );

  const { status } = data;
  const metadata = useMemo(
    () => (status === "loaded" ? data.metadata : null),
    [data, status]
  );

  const nft = useMemo(
    () => (status === "loaded" && metadata ? { ...protoNft, metadata } : null),
    [protoNft, metadata, status]
  ) as NFT | null;

  return status !== "loaded"
    ? { status }
    : {
        status,
        nft: nft as NFT,
      };
}

export function useNftAPI(): NFTMetadataContextAPI {
  const { clearCache, loadNFTMetadata, loadCollectionMetadata } =
    useContext(NftMetadataContext);

  return {
    clearCache,
    loadNFTMetadata,
    loadCollectionMetadata,
  };
}

type NFTMetadataProviderProps = {
  children: React.ReactNode;
};

export function NftMetadataProvider({
  children,
}: NFTMetadataProviderProps): React.ReactElement {
  const [state, setState] = useState<NFTMetadataContextState>({
    cache: {},
  });

  const api: NFTMetadataContextAPI = useMemo(
    () => ({
      loadNFTMetadata: async (
        contract: string,
        tokenId: string,
        currencyId: string
      ) => {
        const key = getNftKey(contract, tokenId, currencyId);
        const currency = getCryptoCurrencyById(currencyId);
        const currencyBridge = getCurrencyBridge(currency);

        if (!currencyBridge.nftResolvers?.nftMetadata) {
          throw new Error("Currency doesn't support NFT metadata");
        }

        setState((oldState) => ({
          ...oldState,
          cache: {
            ...oldState.cache,
            [key]: {
              status: "loading",
            },
          },
        }));

        try {
          const { status, result } =
            await currencyBridge.nftResolvers.nftMetadata({
              contract,
              tokenId,
              currencyId: currency.id,
            });

          switch (status) {
            case 500:
              throw new Error("NFT Metadata Provider failed");
            case 404:
              setState((oldState) => ({
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
              setState((oldState) => ({
                ...oldState,
                cache: {
                  ...oldState.cache,
                  [key]: {
                    status: "loaded",
                    metadata: result,
                    updatedAt: Date.now(),
                  },
                },
              }));
              break;
            default:
              break;
          }
        } catch (error) {
          setState((oldState) => ({
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

        setState((oldState) => ({
          ...oldState,
          cache: {
            ...oldState.cache,
            [key]: {
              status: "loading",
            },
          },
        }));

        try {
          const { status, result } =
            await currencyBridge.nftResolvers.collectionMetadata({
              contract,
              currencyId: currency.id,
            });

          switch (status) {
            case 500:
              throw new Error("NFT Metadata Provider failed");
            case 404:
              setState((oldState) => ({
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
              setState((oldState) => ({
                ...oldState,
                cache: {
                  ...oldState.cache,
                  [key]: {
                    status: "loaded",
                    metadata: result,
                    updatedAt: Date.now(),
                  },
                },
              }));
              break;
            default:
              break;
          }
        } catch (error) {
          setState((oldState) => ({
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
        setState((oldState) => ({
          ...oldState,
          cache: {},
        }));
      },
    }),
    []
  );

  const value = { ...state, ...api };

  return (
    <NftMetadataContext.Provider value={value}>
      {children}
    </NftMetadataContext.Provider>
  );
}
