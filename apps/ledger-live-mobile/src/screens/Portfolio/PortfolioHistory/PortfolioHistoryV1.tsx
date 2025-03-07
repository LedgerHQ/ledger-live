import React from "react";

import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { OperationsList } from "~/screens/Analytics/Operations/OperationsList";

import { PortfolioHistoryProps } from "./types";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";

export const PortfolioHistoryList = withDiscreetMode(
  ({
    accounts,
    allAccounts,
    onEndReached,
    onTransactionButtonPress,
    opCount = 5,
  }: PortfolioHistoryProps) => {
    const { completed, sections } = useOperationsV1(accounts, opCount);

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
