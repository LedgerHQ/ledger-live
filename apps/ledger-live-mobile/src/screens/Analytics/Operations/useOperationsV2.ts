import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";
import { useNftCollectionsStatus } from "~/hooks/nfts/useNftCollectionsStatus";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { isAddressPoisoningOperation } from "@ledgerhq/coin-framework/lib/operation";
import { Operation, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  buildContractIndexNftOperations,
  buildCurrentOperationsPage,
  groupOperationsByDateWithSections,
  OrderedOperation,
  parseAccountOperations,
  splitNftOperationsFromAllOperations,
  useFilterNftSpams,
} from "@ledgerhq/live-nft-react";
import keyBy from "lodash/keyBy";
import { SupportedBlockchain } from "@ledgerhq/live-nft/supported";
import { useHideSpamCollection } from "~/hooks/nfts/useHideSpamCollection";

type Props = {
  opCount: number;
  accounts: AccountLike[];
  withSubAccounts: boolean;
  skipOp: number;
};

export function useOperationsV2({ accounts, opCount, withSubAccounts, skipOp }: Props) {
  const {
    hideSpamCollection,
    spamFilteringTxFeature,
    nftsFromSimplehashFeature,
    nftCollectionsStatusByNetwork,
  } = useHideSpamCollection();

  const threshold = nftsFromSimplehashFeature?.params?.threshold
    ? Number(nftsFromSimplehashFeature?.params?.threshold)
    : 40;

  //both features must be enabled to enable spam filtering
  const spamFilteringTxEnabled =
    (nftsFromSimplehashFeature?.enabled && spamFilteringTxFeature?.enabled) || false;

  const { hiddenNftCollections } = useNftCollectionsStatus();
  const shouldFilterTokenOpsZeroAmount = useSelector(
    filterTokenOperationsZeroAmountEnabledSelector,
  );

  // to avoid multiple state rendering, we store the previous filtered data in an indexed ref object
  const previousFilteredNftData = useRef<{ [key: string]: OrderedOperation }>({});
  const spamOpsCache = useRef<string[]>([]);

  const markNftAsSpam = useCallback(
    (collectionId: string, blockchain: SupportedBlockchain, spamScore: number) => {
      if (spamFilteringTxEnabled && spamScore > threshold) {
        hideSpamCollection(collectionId, blockchain);
      }
    },
    [hideSpamCollection, spamFilteringTxEnabled, threshold],
  );

  const filterOperation = useCallback(
    (operation: Operation, account: AccountLike) => {
      // Remove operations linked to address poisoning
      const removeZeroAmountTokenOp =
        shouldFilterTokenOpsZeroAmount && isAddressPoisoningOperation(operation, account);
      // Remove operations coming from an NFT collection considered spam
      const opFromBlacklistedNftCollection = operation?.nftOperations?.find(op =>
        hiddenNftCollections.includes(`${account.id}|${op?.contract}`),
      );
      return !opFromBlacklistedNftCollection && !removeZeroAmountTokenOp;
    },
    [hiddenNftCollections, shouldFilterTokenOpsZeroAmount],
  );

  const all = withSubAccounts ? flattenAccounts(accounts || []).filter(Boolean) : accounts;

  const allAccountOps = parseAccountOperations(
    all
      ?.flatMap(a =>
        filterOperation
          ? a.operations.filter(operation => filterOperation(operation, a))
          : a.operations,
      )
      .sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }),
  );

  const { opsWithoutNFTIN, opsWithNFTIN } = splitNftOperationsFromAllOperations(allAccountOps);
  const currentPageOpsWithoutNFTIN = opsWithoutNFTIN?.slice(0, opCount);
  const currentPageNFTIN = opsWithNFTIN
    ?.filter(op => !spamOpsCache.current.includes(op.id) && !previousFilteredNftData.current[op.id])
    .slice(skipOp, opCount);

  const accountsMap = keyBy(accounts, "id");

  const relatedNFtOps = buildContractIndexNftOperations(currentPageNFTIN, accountsMap);

  const { filteredOps: filteredNftData, spamOps } = useFilterNftSpams(
    threshold,
    relatedNFtOps,
    currentPageNFTIN,
  );

  spamOpsCache.current = [
    ...new Set(spamOpsCache.current.concat(spamOps.map(op => op.operation.id))),
  ];

  useEffect(() => {
    spamOps.forEach(op => {
      markNftAsSpam(op.collectionId, op.currencyId as SupportedBlockchain, op.spamScore);
    });
  }, [spamOps, markNftAsSpam, nftCollectionsStatusByNetwork]);

  previousFilteredNftData.current = {
    ...previousFilteredNftData.current,
    ...keyBy(filteredNftData as OrderedOperation[], "id"),
  };

  const page = buildCurrentOperationsPage(
    Object.values(previousFilteredNftData.current),
    currentPageOpsWithoutNFTIN,
    opCount,
  );

  const completed = page.length < opCount;

  const groupedOperations = groupOperationsByDateWithSections(page);

  return {
    sections: groupedOperations.sections,
    completed,
  };
}
