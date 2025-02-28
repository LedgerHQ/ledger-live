import React from "react";

import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { useOperationsV2 } from "~/screens/Analytics/Operations/useOperationsV2";
import { OperationsList } from "~/screens/Analytics/Operations/OperationsList";
import { PortfolioHistoryNewProps, PortfolioHistoryProps } from "./types";

const View = withDiscreetMode(
  ({
    accounts,
    allAccounts,
    onEndReached,
    onTransactionButtonPress,
    sections,
    completed,
  }: PortfolioHistoryNewProps) => {
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

const PortfolioHistoryListWithoutSpams = ({
  accounts,
  skipOp = 0,
  opCount = 5,
  ...rest
}: PortfolioHistoryProps) => {
  return (
    <View
      accounts={accounts}
      {...rest}
      {...useOperationsV2({
        accounts,
        opCount,
        skipOp,
        withSubAccounts: true,
      })}
    />
  );
};

export default PortfolioHistoryListWithoutSpams;
