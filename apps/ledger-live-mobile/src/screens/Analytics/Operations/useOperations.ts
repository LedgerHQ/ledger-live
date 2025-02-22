import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";
import { useNftCollectionsStatus } from "~/hooks/nfts/useNftCollectionsStatus";
import { groupAccountsOperationsByDay, flattenAccounts } from "@ledgerhq/live-common/account/index";
import { isAddressPoisoningOperation } from "@ledgerhq/coin-framework/lib/operation";
import { Operation, AccountLike } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import { useSpamTxFiltering } from "@ledgerhq/live-nft-react";
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

  const all = flattenAccounts(accounts || []).filter(Boolean);

  const accountsMap = keyBy(all, "id");

  const groupedOperations = groupAccountsOperationsByDay(accounts, {
    count: opCount,
    withSubAccounts,
    filterOperation,
  });

  const filteredData = useSpamTxFiltering(spamFilteringTxEnabled, accountsMap, groupedOperations);
  return {
    sections: filteredData?.sections,
    completed: filteredData?.completed,
  };
}
