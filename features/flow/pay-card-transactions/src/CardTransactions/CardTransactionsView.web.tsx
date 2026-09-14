import React from "react";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import { List } from "./components/List";
import type { CardTransactionsScreenViewProps } from "./types";

export function CardTransactionsView({
  displayMode,
  title,
  transactions,
  formatAmount,
}: CardTransactionsScreenViewProps) {
  if (displayMode !== "list") {
    return null;
  }

  return (
    <div className="flex flex-col gap-12" data-testid="card-transactions">
      <Subheader>
        <SubheaderRow data-testid="card-transactions-subheader">
          <SubheaderTitle>{title}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <List transactions={transactions} formatAmount={formatAmount} />
    </div>
  );
}
