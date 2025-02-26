import React, { useCallback } from "react";
import { useSelector } from "react-redux";

import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { OperationsList } from "~/screens/Analytics/Operations/operationsList";
import { AccountLike, Operation } from "@ledgerhq/types-live";

import { groupAccountsOperationsByDay } from "@ledgerhq/live-common/account/index";
import { isAddressPoisoningOperation } from "@ledgerhq/coin-framework/lib/operation";
import { useNftCollectionsStatus } from "~/hooks/nfts/useNftCollectionsStatus";
import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";
import { PortfolioHistoryProps } from "./types";

export const PortfolioHistoryList = withDiscreetMode(
  ({
    accounts,
    allAccounts,
    onEndReached,
    onTransactionButtonPress,
    opCount = 5,
  }: PortfolioHistoryProps) => {
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

    const { sections, completed } = groupAccountsOperationsByDay(accounts, {
      count: opCount,
      withSubAccounts: true,
      filterOperation,
    });

    return (
      <OperationsList
        onEndReached={onEndReached}
        onTransactionButtonPress={onTransactionButtonPress}
        accountsFiltered={accounts}
        allAccounts={allAccounts}
        sections={sections}
        completed={completed}
      />
    );
  },
);
