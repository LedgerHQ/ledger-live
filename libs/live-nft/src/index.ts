import { getEnv } from "@ledgerhq/live-env";
import { groupAccountsOperationsByDay } from "@ledgerhq/coin-framework/account/index";
import type { Operation, ProtoNFT, NFT, Account } from "@ledgerhq/types-live";
import { NFTResource } from "./types";

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
  collectionAddress?: string,
): Record<string, Array<ProtoNFT | NFT>> | Array<ProtoNFT | NFT> => {
  return collectionAddress
    ? nfts.filter(n => n.contract === collectionAddress)
    : nfts.reduce((acc: Record<string, Array<ProtoNFT | NFT>>, nft) => {
        const { contract } = nft;

        if (!acc[contract]) {
          acc[contract] = [];
        }
        acc[contract].push(nft);

        return acc;
      }, {});
};

export const getNftKey = (contract: string, tokenId: string, currencyId: string): string => {
  return `${currencyId}-${contract}-${tokenId}`;
};

export const getNftCollectionKey = (contract: string, currencyId: string): string => {
  return `${currencyId}-${contract}`;
};

export const getNFT = (
  contract?: string | null | undefined,
  tokenId?: string | null | undefined,
  nfts?: ProtoNFT[] | null | undefined,
): ProtoNFT | undefined => nfts?.find(nft => nft.contract === contract && nft.tokenId === tokenId);

export const groupByCurrency = (nfts: ProtoNFT[]): ProtoNFT[] => {
  const groupMap = new Map<string, ProtoNFT[]>();
  const SUPPORTED_CURRENCIES = getEnv("NFT_CURRENCIES").split(",");
  SUPPORTED_CURRENCIES.forEach(elem => groupMap.set(elem, []));

  // GROUPING
  nfts.forEach(nft => {
    const currency = nft.currencyId;
    const group = groupMap.get(currency) ?? [];
    group?.push(nft);
    groupMap.set(currency, group);
  });

  return Array.from(groupMap, ([_key, value]) => value).flat();
};

export function orderByLastReceived(accounts: Account[], nfts: ProtoNFT[]): ProtoNFT[] {
  const orderedNFTs: ProtoNFT[] = [];
  let operationMapping: Operation[] = [];

  // TODO optimize: there is no need to use this grouping logic as we just want a sorted merge of all operations
  const res = groupAccountsOperationsByDay(accounts, {
    count: Infinity,
  });

  // Sections are sorted by Date, the most recent being the first
  res.sections.forEach(section => {
    // Get all operation linked to the reception of an NFT
    const operations = section.data.filter(d => d.type === "NFT_IN" && d.contract && d.tokenId);
    operationMapping = operationMapping.concat(operations);
  });

  operationMapping.forEach(operation => {
    // Prevent multiple occurences due to Exchange Send/Receive same NFT several times
    const isAlreadyIn = orderedNFTs.find(
      nft => nft.contract === operation.contract && nft.tokenId === operation.tokenId,
    );

    if (!isAlreadyIn) {
      const nft = getNFT(operation.contract, operation.tokenId, nfts);
      if (nft) orderedNFTs.push(nft);
    }
  });

  return groupByCurrency([...new Set(orderedNFTs)]);
}

export const GENESIS_PASS_COLLECTION_CONTRACT = "0x33c6Eec1723B12c46732f7AB41398DE45641Fa42";
export const INFINITY_PASS_COLLECTION_CONTRACT = "0xfe399E9a4B0bE4087a701fF0B1c89dABe7ce5425";

export const hasNftInAccounts = (nftCollection: string, accounts: Account[]): boolean =>
  accounts &&
  accounts.some(account => account?.nfts?.some((nft: ProtoNFT) => nft?.contract === nftCollection));

// Handle lifecycle of cached data.
// Expiration date depend on the resource's status.
export function isOutdated(resource: NFTResource): boolean {
  const now = Date.now();

  switch (resource.status) {
    case "loaded": {
      return now - resource.updatedAt > 14 * 24 * 60 * 60 * 1 * 1000; // 14 days
    }
    case "error": {
      return now - resource.updatedAt > 1 * 1000; // 1 second
    }
    case "nodata": {
      return now - resource.updatedAt > 24 * 60 * 60 * 1 * 1000; // 1 day
    }
  }
  return false;
}

/**
 * TODO reverse the dependency on this. it's on coin side to be declarative on what is a nft transaction, not for the generic NFT library.
 * due to this, we can't type things correctly
 */
export const isNftTransaction = <T>(transaction: T | undefined | null): boolean => {
  type EvmT = { family: "evm"; mode: string };
  if ((transaction as undefined | EvmT)?.family === "evm") {
    return ["erc721", "erc1155"].includes((transaction as EvmT)?.mode);
  }

  return false;
};
