import React, { useState } from "react";

import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { OperationsList } from "~/screens/Analytics/Operations/OperationsList";

import { PortfolioHistoryProps } from "./types";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";
import { useSelector } from "~/context/hooks";
import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";
import ShowHiddenSmallValueTransactionsToggle from "~/components/ShowHiddenSmallValueTransactionsToggle";

export const PortfolioHistoryList = withDiscreetMode(
  ({
    accounts,
    allAccounts,
    onEndReached,
    onTransactionButtonPress,
    opCount = 5,
  }: PortfolioHistoryProps) => {
    const [showHiddenSmallValueOperations, setShowHiddenSmallValueOperations] = useState(false);
    const isSmallValueFilterEnabled = useSelector(filterTokenOperationsZeroAmountEnabledSelector);
    const effectiveShowHiddenSmallValueOperations =
      isSmallValueFilterEnabled && showHiddenSmallValueOperations;

    const { completed, sections } = useOperationsV1(accounts, opCount, {
      showHiddenSmallValueOperations: effectiveShowHiddenSmallValueOperations,
    });

    return (
      <>
        {isSmallValueFilterEnabled && (
          <ShowHiddenSmallValueTransactionsToggle
            enabled={showHiddenSmallValueOperations}
            onChange={setShowHiddenSmallValueOperations}
          />
        )}
        <OperationsList
          onEndReached={onEndReached}
          onTransactionButtonPress={onTransactionButtonPress}
          accountsFiltered={accounts}
          allAccounts={allAccounts}
          sections={sections}
          completed={completed}
        />
      </>
    );
  },
);
