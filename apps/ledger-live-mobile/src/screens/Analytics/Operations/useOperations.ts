import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";
import { useNftCollectionsStatus } from "~/hooks/nfts/useNftCollectionsStatus";
import { flattenAccounts, groupAccountsOperationsByDay } from "@ledgerhq/live-common/account/index";
import { isAddressPoisoningOperation } from "@ledgerhq/coin-framework/lib/operation";
import { Operation, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  buildContractIndexNftOperations,
  buildCurrentOperationsPage,
  groupOperationsByDateWithSections,
  parseAccountOperations,
  splitNftOperationsFromAllOperations,
  useFilterNftSpams,
} from "@ledgerhq/live-nft-react";
import keyBy from "lodash/keyBy";

type Props = {
  opCount: number;
  accounts: AccountLike[];
  withSubAccounts: boolean;
};

// TODO: withSubAccounts is not used in this function -> TO NOT FORGET
export function useOperations({ accounts, opCount, withSubAccounts, skipOp }: Props) {
  const spamFilteringTxFeature = useFeature("llmSpamFilteringTx");
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");

  //both features must be enabled to enable spam filtering
  const spamFilteringTxEnabled =
    (nftsFromSimplehashFeature?.enabled && spamFilteringTxFeature?.enabled) || false;

  const { hiddenNftCollections } = useNftCollectionsStatus();
  const shouldFilterTokenOpsZeroAmount = useSelector(
    filterTokenOperationsZeroAmountEnabledSelector,
  );

  // to avoid multiple state rendering, we store the previous filtered data in an indexed ref object
  const previousFilteredNftData = useRef({});
  const spamOpsCache = useRef<string[]>([]);

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

  const allAccountOps = parseAccountOperations(
    accounts
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
    ?.filter(op => !spamOpsCache.current.includes(op.id))
    .slice(skipOp, opCount);


  const accountsMap = keyBy(accounts, "id");

  const relatedNFtOps = buildContractIndexNftOperations(currentPageNFTIN, accountsMap);

  const { filteredOps: filteredNftData, spamOps } = useFilterNftSpams(
    70,
    relatedNFtOps,
    currentPageNFTIN,
  );

  spamOpsCache.current = spamOpsCache.current.concat(spamOps.map(op => op.operation.id));

  previousFilteredNftData.current = {
    ...previousFilteredNftData.current,
    ...keyBy(filteredNftData, "order"),
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
    spamFilteringTxEnabled,
  };
}
