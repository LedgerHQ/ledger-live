import React, { type ComponentType, type ReactNode } from "react";
import type { FamilyBlocksViewModel } from "./useFamilyBlocksViewModel";

const renderFamilyBlock = <P extends object>(
  Component: ComponentType<P> | undefined,
  props: P,
): ReactNode => {
  return Component ? React.createElement(Component, props) : null;
};

export const FamilyBlocksView = ({
  account,
  family,
  counterValue,
  discreetMode,
  showBalanceSummaryFooter,
  showBodyBlocks,
}: FamilyBlocksViewModel) => {
  return (
    <>
      {renderFamilyBlock(family.PendingTransferProposals, { account, parentAccount: account })}
      {renderFamilyBlock(family.AccountSubHeader, { account, parentAccount: undefined })}
      {showBalanceSummaryFooter
        ? renderFamilyBlock(family.AccountBalanceSummaryFooter, {
            account,
            counterValue,
            discreetMode,
          })
        : null}
      {showBodyBlocks
        ? renderFamilyBlock(family.AccountBodyHeader, { account, parentAccount: undefined })
        : null}
    </>
  );
};
