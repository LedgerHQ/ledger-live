import React, { useCallback } from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { StatusIcon } from "./StatusIcon";
import { useHistoryRowViewModel } from "./useHistoryRowViewModel";
import type { HistoryRowProps } from "./types";

export function HistoryRow({ item, formatters, onRowClick }: HistoryRowProps) {
  const row = useHistoryRowViewModel(item, formatters);
  const onPress = useCallback(() => onRowClick(item), [item, onRowClick]);

  return (
    <ListItem
      onPress={onPress}
      testID={`card-history-row-${row.id}`}
      lx={{ marginHorizontal: "-s8" }}
    >
      <ListItemLeading>
        <StatusIcon
          category={row.category}
          categoryLabel={row.categoryLabel}
          status={row.status}
          iconSize={48}
        />
        <ListItemContent>
          <ListItemTitle>{row.merchant}</ListItemTitle>
          <ListItemDescription>
            {row.statusLabel ? `${row.statusLabel} · ` : ""}
            {row.time}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent lx={{ alignItems: "flex-end" }}>
          <ListItemTitle>{row.amount}</ListItemTitle>
          {row.fundingLabel ? <ListItemDescription>{row.fundingLabel}</ListItemDescription> : null}
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}
