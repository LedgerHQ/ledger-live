import eip55 from "eip55";
import BigNumber from "bignumber.js";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { decodeAccountId, groupAccountsOperationsByDay } from "../account";

import type { Batch, BatchElement, Batcher } from "./NftMetadataProvider/types";
import type {
  NFTMetadataResponse,
  Operation,
  ProtoNFT,
  NFT,
  NFTCollectionMetadataResponse,
  Account,
} from "@ledgerhq/types-live";
import { API, apiForCurrency } from "../api/Ethereum";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export const nftsFromOperations = (ops: Operation[]): ProtoNFT[] => {
  const nftsMap = ops
    .slice(0)
    // make sure we have the operation in chronological order (older first)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
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
        const newAmount = nft.amount.minus(nftOp.value);

        // In case of OpenSea lazy minting feature (minting an NFT off-chain)
        // OpenSea will fire a false ERC1155 event saying that you sent an NFT
        // from your account that you never received first.
        //
        // E.g.: I'm creating 10 ERC1155 on OpenSea. It's not going to create anything on-chain.
        // Then I (bob) decide to transfer 5 to someone (kvn). OpenSea is going to mint the NFT in its
        // collection (`OpenSea Shared Storefront` / `OpenSea Collections`) and transfer it to kvn.
        // But the event fired by the Smart Contract is going to be `bob transfered 5 NFT to kvn` which is false.
        // It would then result in bob have -5 NFTs since he never received them first.
        // If kvn send 2 back to bob, based on the events we would think that bob has -3 NFTs.
        //
        // To mitigate that we put a minimum value of 0 when an account is transferring some NFTs.
        nft.amount = newAmount.isNegative() ? new BigNumber(0) : newAmount;
      }

      acc[id] = nft;

      return acc;
    }, {});

  // We reverse the array to make it from latest to oldest again
  return Object.values(nftsMap).reverse();
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

export const getNftCollectionKey = (
  contract: string,
  currencyId: string
): string => {
  return `${currencyId}-${contract}`;
};

/**
 * Factory to make a metadata API call batcher.
 *
 * It will wait for a complete `tick` to accumulate all the metadata requests
 * before sending it as one call to a given API.
 * Once the response is received, it will then spread the metadata to each request Promise,
 * just like if each request had been made separately.
 */
const makeBatcher = (
  call: API["getNFTMetadata"] | API["getNFTCollectionMetadata"],
  chainId: number
): Batcher =>
  (() => {
    const queue: BatchElement[] = [];

    let debounce;
    const timeoutBatchCall = () => {
      // Clear the previous scheduled call if it was existing
      clearTimeout(debounce);

      // Schedule a new call with the whole batch
      debounce = setTimeout(() => {
        // Seperate each batch element properties into arrays by type and index
        const { elements, resolvers, rejecters } = queue.reduce(
          (acc, { element, resolve, reject }) => {
            acc.elements.push(element);
            acc.resolvers.push(resolve);
            acc.rejecters.push(reject);

            return acc;
          },
          { elements: [], resolvers: [], rejecters: [] } as Batch
        );
        // Empty the queue
        queue.length = 0;

        // Make the call with all the couples of contract and tokenId at once
        call(elements, chainId.toString())
          .then((res: any) => {
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
      load(
        element:
          | {
              contract: string;
              tokenId: string;
            }
          | { contract: string }
      ): Promise<NFTMetadataResponse | NFTCollectionMetadataResponse> {
        return new Promise((resolve, reject) => {
          queue.push({ element, resolve, reject });
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
export const metadataCallBatcher = (
  currency: CryptoCurrency
): { loadNft: Batcher["load"]; loadCollection: Batcher["load"] } => {
  const api: API = apiForCurrency(currency);
  const chainId = currency?.ethereumLikeInfo?.chainId;

  if (!chainId || !api) {
    throw new Error("Ethereum: No API or chainId for this Currency");
  }

  if (!batchersMap.has(currency.id)) {
    batchersMap.set(currency.id, {
      nft: makeBatcher(api.getNFTMetadata, chainId),
      collection: makeBatcher(api.getNFTCollectionMetadata, chainId),
    });
  }

  const batchers = batchersMap.get(currency.id);
  return {
    loadNft: batchers.nft.load,
    loadCollection: batchers.collection.load,
  };
};

export const getNFT = (
  contract?: string,
  tokenId?: string,
  nfts?: ProtoNFT[]
): ProtoNFT | undefined =>
  nfts?.find((nft) => nft.contract === contract && nft.tokenId === tokenId);

const SUPPORTED_CURRENCIES = ["ethereum", "polygon"];

export const groupByCurrency = (nfts: ProtoNFT[]): ProtoNFT[] => {
  const groupMap = new Map<string, ProtoNFT[]>();
  SUPPORTED_CURRENCIES.forEach((elem) => groupMap.set(elem, []));

  // GROUPING
  nfts.forEach((nft) => {
    const currency = nft.currencyId;
    const group = groupMap.get(currency) ?? [];
    group?.push(nft);
    groupMap.set(currency, group);
  });

  return Array.from(groupMap, ([_key, value]) => value).flat();
};

export function orderByLastReceived(
  accounts: Account[],
  nfts: ProtoNFT[]
): ProtoNFT[] {
  const orderedNFTs: ProtoNFT[] = [];
  let operationMapping: Operation[] = [];

  const res = groupAccountsOperationsByDay(accounts, {
    count: Infinity,
  });

  // Sections are sorted by Date, the most recent being the first
  res.sections.forEach((section) => {
    // Get all operation linked to the reception of an NFT
    const operations = section.data.filter(
      (d) => d.type === "NFT_IN" && d.contract && d.tokenId
    );
    operationMapping = operationMapping.concat(operations);
  });

  operationMapping.forEach((operation) => {
    // Prevent multiple occurences due to Exchange Send/Receive same NFT several times
    const isAlreadyIn = orderedNFTs.find(
      (nft) =>
        nft.contract === operation.contract && nft.tokenId === operation.tokenId
    );

    if (!isAlreadyIn) {
      const nft = getNFT(operation.contract, operation.tokenId, nfts);
      if (nft) orderedNFTs.push(nft);
    }
  });

  return groupByCurrency([...new Set(orderedNFTs)]);
}
