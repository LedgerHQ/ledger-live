import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { Currency, findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { API, apiForCurrency } from "../../api/Ethereum";
import { NFT, NFTMetadataResponse } from "../../types";
import { getNftKey } from "../helpers";
import {
  Batch,
  BatchElement,
  NFTMetadataContextAPI,
  NFTMetadataContextState,
  NFTMetadataContextType,
  NFTResource,
} from "./types";
import { isOutdated } from "./logic";

const currency: Currency = findCryptoCurrencyById("ethereum")!;
const ethApi: API = apiForCurrency(currency);

const NftMetadataContext = createContext<NFTMetadataContextType>({
  cache: {},
  loadNFTMetadata: () => Promise.resolve(),
  clearCache: () => {},
});

export const metadataCallBatcher = (() => {
  const batch: BatchElement[] = [];

  let debounce;
  const timeoutBatchCall = () => {
    // Clear the previous scheduled call if it was existing
    clearTimeout(debounce);

    // Schedule a new call with the whole batch
    debounce = setTimeout(() => {
      // Seperate each batch element properties into arrays by type and index
      const { couples, resolvers, rejecters } = batch.reduce(
        (acc, { couple, resolve, reject }) => {
          acc.couples.push(couple);
          acc.resolvers.push(resolve);
          acc.rejecters.push(reject);

          return acc;
        },
        { couples: [], resolvers: [], rejecters: [] } as Batch
      );
      // Empty the batch
      batch.length = 0;

      // Make the call with all the couples of contract and tokenId at once
      ethApi
        .getNFTMetadata(couples)
        .then((res) => {
          // Resolve each batch element with its own resolver and only its response
          res.forEach((metadata, index) => resolvers[index](metadata));
        })
        .catch((err) => {
          // Reject all batch element with the error
          rejecters.forEach((reject) => reject(err));
        });
    });
  };

  return {
    // Load the metadata for a given couple contract + tokenId
    load({ contract, tokenId }): Promise<NFTMetadataResponse> {
      return new Promise((resolve, reject) => {
        batch.push({ couple: { contract, tokenId }, resolve, reject });
        timeoutBatchCall();
      });
    },
  };
})();

// DEPRECATED, use useNftResource
export function useNftMetadata(
  contract: string | undefined,
  tokenId: string | undefined
): NFTResource {
  const { cache, loadNFTMetadata } = useContext(NftMetadataContext);

  const key = contract && tokenId ? getNftKey(contract, tokenId) : "";

  const cachedData = cache[key];

  useEffect(() => {
    if (!contract || !tokenId) return;
    if (!cachedData || isOutdated(cachedData)) {
      loadNFTMetadata(contract, tokenId);
    }
  }, [contract, tokenId, cachedData, loadNFTMetadata]);

  if (cachedData) {
    return cachedData;
  } else {
    return {
      status: "queued",
    };
  }
}

export function useNftResource(nft: NFT | undefined): NFTResource {
  return useNftMetadata(nft?.collection.contract, nft?.tokenId);
}

export function useNftAPI(): NFTMetadataContextAPI {
  const { clearCache, loadNFTMetadata } = useContext(NftMetadataContext);

  return {
    clearCache,
    loadNFTMetadata,
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

  const api = useMemo(
    () => ({
      loadNFTMetadata: async (contract: string, tokenId: string) => {
        const key = getNftKey(contract, tokenId);

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
          const { status, result } = await metadataCallBatcher.load({
            contract,
            tokenId,
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
                    metadata: result || {},
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
