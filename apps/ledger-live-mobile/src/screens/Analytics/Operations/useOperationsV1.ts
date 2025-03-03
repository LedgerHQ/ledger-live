import { groupAccountsOperationsByDay } from "@ledgerhq/coin-framework/lib/account/groupOperations";
import { isAddressPoisoningOperation } from "@ledgerhq/coin-framework/lib/operation";
import { Operation, AccountLike } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import { useNftCollectionsStatus } from "~/hooks/nfts/useNftCollectionsStatus";
import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";

export function useOperationsV1(accounts: AccountLike[], opCount: number) {
  const { hiddenNftCollections } = useNftCollectionsStatus(true);
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

  const { sections, completed } = groupAccountsOperationsByDay(accounts, {
    count: opCount,
    withSubAccounts: true,
    filterOperation,
  });

  return {
    sections,
    completed,
  };
}
