import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import { BlockchainsType, BlockchainEVM } from "@ledgerhq/live-nft/supported";
import { NFTResource } from "@ledgerhq/live-nft/types";
import {
  Operation,
  AccountLike,
  DailyOperations,
  NFTCollectionMetadataResponse,
} from "@ledgerhq/types-live";
import { useMemo } from "react";
import { useNftCollectionMetadataBatch } from "../NftMetadataProvider";

type AccountMap = Record<string, AccountLike>;

type NftOp = {
  contract: string;
  currencyId: string;
};

type NftOperations = Record<string, NftOp>;

export function getNftOperations({
  accountsMap,
  groupedOperations,
  spamFilteringTxEnabled,
}: {
  accountsMap: AccountMap;
  groupedOperations: DailyOperations;
  spamFilteringTxEnabled: boolean;
}) {
  if (!spamFilteringTxEnabled) return {};

  return groupedOperations?.sections
    .flatMap(section => section.data)
    .reduce((acc: NftOperations, operation: Operation): NftOperations => {
      if (operation.type === "NFT_IN") {
        const account = accountsMap[operation.accountId];
        const contract = operation.contract || "";
        acc[contract] = {
          contract,
          currencyId: getAccountCurrency(account).id,
        };
      }
      return acc;
    }, {});
}

export function filterSection(
  operations: Operation[],
  metadataMap: Map<string | undefined, number>,
  accountsMap: AccountMap,
  markNftAsSpam?: (collectionId: string, blockchain: BlockchainsType, spamScore: number) => void,
  threshold?: number,
) {
  const filtered = new Map<string, Operation>();
  operations.forEach(item => {
    if (item.type === "NFT_IN") {
      const spamScore = metadataMap.get(item.contract?.toLowerCase());
      const ca = `${item.accountId}|${item.contract}`;
      const account = accountsMap[item.accountId];
      const currencyId = getAccountCurrency(account).id;

      if (!spamScore || (threshold && spamScore <= threshold)) {
        filtered.set(item.id, item);
      } else {
        markNftAsSpam?.(ca, currencyId as BlockchainEVM, spamScore);
      }
    } else {
      filtered.set(item.id, item);
    }
  });

  return Array.from(filtered.values());
}

export function filterGroupedOperations(
  metadatas: Array<NFTResource<NonNullable<NFTCollectionMetadataResponse["result"]>>>,
  accountsMap: AccountMap,
  groupedOperations: DailyOperations,
  markNftAsSpam?: (collectionId: string, blockchain: BlockchainsType, spamScore: number) => void,
  threshold?: number,
): DailyOperations {
  const metadataMap = new Map(
    metadatas.map(meta => [meta.metadata?.contract.toLowerCase(), meta.metadata?.spamScore ?? 0]),
  );

  return {
    ...groupedOperations,
    sections: groupedOperations.sections.map(section => ({
      ...section,
      data: filterSection(section.data, metadataMap, accountsMap, markNftAsSpam, threshold),
    })),
  };
}

export function useSpamTxFiltering(
  spamFilteringTxEnabled: boolean,
  accountsMap: AccountMap,
  groupedOperations: DailyOperations,
  markNftAsSpam?: (collectionId: string, blockchain: BlockchainsType, spamScore: number) => void,
  threshold?: number,
) {
  const nftOperations = getNftOperations({
    accountsMap,
    groupedOperations,
    spamFilteringTxEnabled,
  });

  const metadatas = useNftCollectionMetadataBatch(
    useMemo(() => Object.values(nftOperations), [nftOperations]),
  );

  return useMemo(
    (): DailyOperations =>
      spamFilteringTxEnabled
        ? filterGroupedOperations(
            metadatas,
            accountsMap,
            groupedOperations,
            markNftAsSpam,
            threshold,
          )
        : groupedOperations,
    [accountsMap, groupedOperations, markNftAsSpam, metadatas, spamFilteringTxEnabled, threshold],
  );
}
