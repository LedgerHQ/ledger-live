import React from "react";

import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { useOperations } from "~/screens/Analytics/Operations/useOperations";
import { OperationsList } from "~/screens/Analytics/Operations/operationsList";
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
      {...useOperations({
        accounts,
        opCount,
        skipOp,
        withSubAccounts: true,
      })}
    />
  );
};

export default PortfolioHistoryListWithoutSpams;
