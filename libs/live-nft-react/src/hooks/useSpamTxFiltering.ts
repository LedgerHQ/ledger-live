import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import { NFTResource, NFTOperations } from "@ledgerhq/live-nft/types";
import {
  Operation,
  AccountLike,
  DailyOperations,
  NFTCollectionMetadataResponse,
} from "@ledgerhq/types-live";
import { useMemo } from "react";
import { useNftCollectionMetadataBatch } from "../NftMetadataProvider";

type AccountMap = Record<string, AccountLike>;

export function getFilteredNftOperations({
  accountsMap,
  groupedOperations,
  spamFilteringTxEnabled,
}: {
  accountsMap: AccountMap;
  groupedOperations: DailyOperations;
  spamFilteringTxEnabled: boolean;
}) {
  return spamFilteringTxEnabled
    ? groupedOperations?.sections
        .flatMap(section => section.data)
        .reduce((acc: NFTOperations, operation: Operation): NFTOperations => {
          if (operation.type === "NFT_IN") {
            const account = accountsMap[operation.accountId];
            const contract = operation.contract || "";
            acc[contract] = {
              contract,
              currencyId: getAccountCurrency(account).id,
            };
          }
          return acc;
        }, {})
    : {};
}

export function filterSection(
  operations: Operation[],
  metadataMap: Map<string | undefined, number>,
  threshold?: number,
) {
  const filtered = new Map<string, Operation>();
  operations.forEach(item => {
    if (item.type === "NFT_IN") {
      const spamScore = metadataMap.get(item.contract?.toLowerCase());

      if (!spamScore || (threshold && spamScore <= threshold)) {
        filtered.set(item.id, item);
      }
    } else {
      filtered.set(item.id, item);
    }
  });

  return Array.from(filtered.values());
}

export function filterGroupedOperations(
  metadatas: Array<NFTResource<NonNullable<NFTCollectionMetadataResponse["result"]>>>,
  groupedOperations: DailyOperations,
  threshold?: number,
): DailyOperations {
  const metadataMap = new Map(
    metadatas.map(meta => [meta.metadata?.contract.toLowerCase(), meta.metadata?.spamScore ?? 0]),
  );

  return {
    ...groupedOperations,
    sections: groupedOperations.sections.map(section => ({
      ...section,
      data: filterSection(section.data, metadataMap, threshold),
    })),
  };
}

export function useSpamTxFiltering(
  spamFilteringTxEnabled: boolean,
  accountsMap: AccountMap,
  groupedOperations: DailyOperations,
  setNftStatus?: (metadata: Array<NFTResource>) => void,
  threshold?: number,
) {
  const nftOperations = useMemo(
    () =>
      getFilteredNftOperations({
        accountsMap,
        groupedOperations,
        spamFilteringTxEnabled,
      }),
    [accountsMap, groupedOperations, spamFilteringTxEnabled],
  );

  const metadatas = useNftCollectionMetadataBatch(nftOperations);
  //setNftStatus(metadatas);
  return useMemo(
    (): DailyOperations =>
      spamFilteringTxEnabled
        ? filterGroupedOperations(metadatas, groupedOperations, threshold)
        : groupedOperations,
    [groupedOperations, metadatas, spamFilteringTxEnabled, threshold],
  );
}
