import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";
import { useNftCollectionsStatus } from "~/hooks/nfts/useNftCollectionsStatus";
import { groupAccountsOperationsByDay } from "@ledgerhq/live-common/account/index";
import { isAddressPoisoningOperation } from "@ledgerhq/coin-framework/lib/operation";
import { Operation, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  buildContractIndexNftOperations,
  parseAccountOperations,
  splitNftOperationsFromAllOperations,
  useFilterNftSpams,
} from "@ledgerhq/live-nft-react";
import { fakeAccounts } from "./fakeData";
import keyBy from "lodash/keyBy";

type Props = {
  opCount: number;
  accounts: AccountLike[];
  withSubAccounts: boolean;
};

export function useOperations({ accounts, opCount, withSubAccounts }: Props) {
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

  const groupedOperations = groupAccountsOperationsByDay(accounts, {
    count: opCount,
    withSubAccounts,
    filterOperation,
  });


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

  console.warn("allAccountOps", allAccountOps.length);

   const { opsWithoutNFTIN, opsWithNFTIN } = splitNftOperationsFromAllOperations(allAccountOps);
  const currentPageOpsWithoutNFTIN = opsWithoutNFTIN?.slice(0, opCount);
  const currentPageNFTIN = opsWithNFTIN
    ?.filter(op => !spamOpsCache.current.includes(op.id))
    .slice(0, opCount);

    const all = flattenAccounts(accounts || []).filter(Boolean);
    
    const accountsMap = keyBy(all, "id");
    
  const relatedNFtOps = buildContractIndexNftOperations(currentPageNFTIN, accountsMap);

  console.log("relatedNFtOps", relatedNFtOps);
  const {
    filteredOps: filteredNftData,
    spamOps,
    isFetching,
  } = useFilterNftSpams(70, relatedNFtOps, currentPageNFTIN);


  spamOpsCache.current = spamOps.map(op => op.operation.id);


  // const filteredData = useSpamTxFiltering(spamFilteringTxEnabled, accountsMap, groupedOperations);
  return {
    sections: groupedOperations.sections,
    completed: groupedOperations.completed,
    spamFilteringTxEnabled,
  };
}
