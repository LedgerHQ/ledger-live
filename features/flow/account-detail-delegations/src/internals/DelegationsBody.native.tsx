import React from "react";
import { Box, Skeleton } from "@ledgerhq/lumen-ui-rnative";
import type { AccountDelegationsProps } from "../components/AccountDelegations/AccountDelegations.types";
import { DelegationsEmptyState } from "./DelegationsEmptyState";
import { DelegationsList } from "./DelegationsList";

const LOADING_ROWS = 3;

type Props = AccountDelegationsProps & Readonly<{ onSelectRow: (rowId: string) => void }>;

export const DelegationsBody = ({
  columns,
  rows,
  emptyState,
  loading = false,
  discreet = false,
  onSelectRow,
  onStartDelegating,
  onLearnMore,
  testID,
}: Props) => {
  if (loading) {
    return (
      <Box lx={{ gap: "s8" }} testID={testID ? `${testID}-loading` : undefined}>
        {Array.from({ length: LOADING_ROWS }, (_, index) => (
          <Skeleton key={index} component="list-item" />
        ))}
      </Box>
    );
  }

  if (rows.length > 0) {
    return (
      <DelegationsList
        columns={columns}
        rows={rows}
        discreet={discreet}
        onSelectRow={onSelectRow}
      />
    );
  }

  if (!emptyState) return null;

  return (
    <DelegationsEmptyState
      emptyState={emptyState}
      onStartDelegating={onStartDelegating}
      onLearnMore={onLearnMore}
      testID={testID}
    />
  );
};
