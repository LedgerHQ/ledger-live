import React, { type ReactNode } from "react";
import {
  Box,
  Subheader,
  SubheaderRow,
  SubheaderShowMore,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import OperationsListItem from "../../screens/OperationsList/components/OperationsListItem";
import type { RecentOperationsViewModel } from "./useRecentOperationsViewModel";

type Props = RecentOperationsViewModel &
  Readonly<{
    title: string;
    testID: string;
    headerTestID: string;
    fallback: ReactNode;
  }>;

export function RecentOperationsView({
  operations,
  accountByAddress,
  lastSeenTs,
  findAccount,
  onHeaderPress,
  hasData,
  title,
  testID,
  headerTestID,
  fallback,
}: Props) {
  if (!hasData) return <>{fallback}</>;

  return (
    <Box testID={testID}>
      <Subheader>
        <SubheaderRow
          onPress={onHeaderPress}
          accessibilityRole="button"
          testID={headerTestID}
          lx={{ marginBottom: "s12" }}
        >
          <SubheaderTitle>{title}</SubheaderTitle>
          <SubheaderShowMore />
        </SubheaderRow>
      </Subheader>
      {operations.map(op => {
        const resolved = findAccount(op.accountId);
        if (!resolved) return null;
        return (
          <OperationsListItem
            key={`${op.accountId}_${op.id}_${op.type}`}
            operation={op}
            account={resolved.account}
            parentAccount={resolved.parentAccount}
            accountByAddress={accountByAddress}
            isPending={op.blockHeight == null}
            lastSeenTs={lastSeenTs}
          />
        );
      })}
    </Box>
  );
}
