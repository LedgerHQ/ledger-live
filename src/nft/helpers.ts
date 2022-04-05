import eip55 from "eip55";
import BigNumber from "bignumber.js";
import { encodeNftId } from ".";
import { decodeAccountId } from "../account";

import type { Batch, BatchElement, Batcher } from "./NftMetadataProvider/types";
import type {
  NFTMetadataResponse,
  Operation,
  ProtoNFT,
  NFT,
  CryptoCurrency,
} from "../types";
import { API, apiForCurrency } from "../api/Ethereum";

export const nftsFromOperations = (ops: Operation[]): ProtoNFT[] => {
  const nftsMap = ops
    // if ops are Operations get the prop nftOperations, else ops are considered nftOperations already
    .flatMap((op) => (op?.nftOperations?.length ? op.nftOperations : op))
    .reduce((acc: Record<string, ProtoNFT>, nftOp: Operation) => {
      let { contract } = nftOp;
      if (!contract) {
        return acc;
      }

      // Creating a "token for a contract" unique key
      contract = eip55.encode(contract);
      const { tokenId, standard, accountId } = nftOp;
      const { currencyId } = decodeAccountId(nftOp.accountId);
      if (!tokenId || !standard) return acc;
      const id = encodeNftId(accountId, contract, tokenId, currencyId);

      const nft = (acc[id] || {
        id,
        tokenId,
        amount: new BigNumber(0),
        contract,
        standard,
        currencyId,
      }) as ProtoNFT;

      if (nftOp.type === "NFT_IN") {
        nft.amount = nft.amount.plus(nftOp.value);
      } else if (nftOp.type === "NFT_OUT") {
        nft.amount = nft.amount.minus(nftOp.value);
      }

      acc[id] = nft;

      return acc;
    }, {});

  return Object.values(nftsMap);
};

/**
 * Helper to group NFTs by their collection/contract.
 *
 * It will either return an object { [contract address]: NFT[] }
 * or if you specify a collectionAddress it will simply filter
 * your NFTs for this specific contract and return an NFT[].
 *
 * The grouping here can be done with ProtoNFT or NFT.
 */
export const nftsByCollections = (
  nfts: Array<ProtoNFT | NFT> = [],
  collectionAddress?: string
): Record<string, Array<ProtoNFT | NFT>> | Array<ProtoNFT | NFT> => {
  return collectionAddress
    ? nfts.filter((n) => n.contract === collectionAddress)
    : nfts.reduce((acc, nft) => {
        const { contract } = nft;

        if (!acc[contract]) {
          acc[contract] = [];
        }
        acc[contract].push(nft);

        return acc;
      }, {});
};

export const getNftKey = (
  contract: string,
  tokenId: string,
  currencyId: string
): string => {
  return `${currencyId}-${contract}-${tokenId}`;
};

/**
 * Factory to make a metadata API call batcher.
 *
 * It will wait for a complete `tick` to accumulate all the metadata requests
 * before sending it as one call to a given API.
 * Once the response is received, it will then spread the metadata to each request Promise,
 * just like if each request had been made separately.
 */
const makeBatcher = (api: API, chainId: number): Batcher =>
  (() => {
    const queue: BatchElement[] = [];

    let debounce;
    const timeoutBatchCall = () => {
      // Clear the previous scheduled call if it was existing
      clearTimeout(debounce);

      // Schedule a new call with the whole batch
      debounce = setTimeout(() => {
        // Seperate each batch element properties into arrays by type and index
        const { couples, resolvers, rejecters } = queue.reduce(
          (acc, { couple, resolve, reject }) => {
            acc.couples.push(couple);
            acc.resolvers.push(resolve);
            acc.rejecters.push(reject);

            return acc;
          },
          { couples: [], resolvers: [], rejecters: [] } as Batch
        );
        // Empty the queue
        queue.length = 0;

        // Make the call with all the couples of contract and tokenId at once
        api
          .getNFTMetadata(couples, chainId.toString())
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
      load({
        contract,
        tokenId,
      }: {
        contract: string;
        tokenId: string;
      }): Promise<NFTMetadataResponse> {
        return new Promise((resolve, reject) => {
          queue.push({ couple: { contract, tokenId }, resolve, reject });
          timeoutBatchCall();
        });
      },
    };
  })();

const batchersMap = new Map();

/**
 * In order to `instanciate`/make only 1 batcher by currency,
 * they're `cached` in a Map and retrieved by this method
 * This method is still EVM based for now but can be improved
 * to implement an even more generic solution
 */
export const metadataCallBatcher = (currency: CryptoCurrency): Batcher => {
  const api: API = apiForCurrency(currency);
  const chainId = currency?.ethereumLikeInfo?.chainId;

  if (!chainId || !api) {
    throw new Error("Ethereum: No API or chainId for this Currency");
  }

  if (!batchersMap.has(currency.id)) {
    batchersMap.set(currency.id, makeBatcher(api, chainId));
  }

  return batchersMap.get(currency.id);
};
