import React from "react";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { List } from "./components/List";
import type { CardTransactionsScreenViewProps } from "./types";

export function CardTransactionsView({
  displayMode,
  title,
  transactions,
  formatters,
}: CardTransactionsScreenViewProps) {
  if (displayMode !== "list") {
    return null;
  }

  return (
    <Box lx={listContainerStyle} testID="card-transactions">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{title}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <List transactions={transactions} formatters={formatters} />
    </Box>
  );
}

const listContainerStyle: LumenViewStyle = {
  gap: "s12",
};
