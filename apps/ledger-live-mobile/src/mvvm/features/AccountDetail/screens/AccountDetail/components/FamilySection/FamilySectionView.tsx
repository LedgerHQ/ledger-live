import React, { type ReactNode } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { AccountNotices } from "@features/flow-account-detail-notices";
import perFamilyAccountHeader from "~/generated/AccountHeader";
import perFamilyAccountSubHeader from "~/generated/AccountSubHeader";
import perFamilyAccountBalanceHeader from "~/generated/AccountBalanceHeader";
import perFamilyAccountBodyHeader from "~/generated/AccountBodyHeader";
import perFamilyAccountBalanceSummaryFooter from "~/generated/AccountBalanceSummaryFooter";
import perFamilyPendingTransferProposals from "~/generated/PendingTransferProposals";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../../../testIds";
import type { FamilySectionViewModel } from "./useFamilySectionViewModel";

type FamilyBlockProps = Partial<{ account: AccountLike; parentAccount: Account }>;

type FamilyComponent = ((props: FamilyBlockProps) => ReactNode) | undefined;

const renderFamilyBlock = (map: object, family: string, props: FamilyBlockProps): ReactNode => {
  const Component = (map as Record<string, FamilyComponent>)[family];
  return Component ? React.createElement(Component, props) : null;
};

export const FamilySectionView = ({
  account,
  notices,
  showEarnBlocks,
  showBodyBlocks,
  onOpenLink,
  onOpenPerps,
}: FamilySectionViewModel) => {
  const { family } = account.currency;
  const blockProps = { account };

  return (
    <>
      <AccountNotices
        notices={notices}
        onOpenLink={onOpenLink}
        onOpenPerps={onOpenPerps}
        testID={ACCOUNT_DETAIL_TEST_IDS.notices}
      />
      {showEarnBlocks ? renderFamilyBlock(perFamilyAccountHeader, family, blockProps) : null}
      {renderFamilyBlock(perFamilyAccountBalanceHeader, family, blockProps)}
      {renderFamilyBlock(perFamilyAccountSubHeader, family, blockProps)}
      {renderFamilyBlock(perFamilyPendingTransferProposals, family, {
        account,
        parentAccount: account,
      })}
      {showBodyBlocks ? (
        <React.Suspense fallback={null}>
          {renderFamilyBlock(perFamilyAccountBodyHeader, family, blockProps)}
        </React.Suspense>
      ) : null}
      {showEarnBlocks
        ? renderFamilyBlock(perFamilyAccountBalanceSummaryFooter, family, blockProps)
        : null}
    </>
  );
};
