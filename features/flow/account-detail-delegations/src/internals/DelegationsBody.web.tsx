import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import type { AccountDelegationsProps } from "../components/AccountDelegations/AccountDelegations.types";
import { DelegationsEmptyState } from "./DelegationsEmptyState";
import { DelegationsTable } from "./DelegationsTable";

const LOADING_ROWS = 3;

export const DelegationsBody = ({
  title,
  validatorColumnLabel,
  statusColumnLabel,
  columns,
  rows,
  emptyState,
  loading = false,
  discreet = false,
  rowActionsLabel,
  onOpenValidator,
  onSelectRowAction,
  onStartDelegating,
  onLearnMore,
  testID,
}: AccountDelegationsProps) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-8" data-testid={testID ? `${testID}-loading` : undefined}>
        {Array.from({ length: LOADING_ROWS }, (_, index) => (
          <Skeleton key={index} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length > 0) {
    return (
      <DelegationsTable
        validatorColumnLabel={validatorColumnLabel ?? title}
        statusColumnLabel={statusColumnLabel}
        columns={columns}
        rows={rows}
        discreet={discreet}
        rowActionsLabel={rowActionsLabel}
        onOpenValidator={onOpenValidator}
        onSelectRowAction={onSelectRowAction}
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
