import React from "react";
import { Box, Skeleton } from "@ledgerhq/lumen-ui-rnative";
import { CardAssetRow } from "./CardAssetRow.native";
import { CardAssetsEmptyState } from "./CardAssetsEmptyState.native";
import type { CardAssetsViewModel } from "./types";

type CardAssetsBodyProps = Readonly<
  Pick<CardAssetsViewModel, "status" | "rows" | "onAssetPress" | "onRetryPress" | "onAddAssetPress">
>;

export function CardAssetsBody({
  status,
  rows,
  onAssetPress,
  onRetryPress,
  onAddAssetPress,
}: CardAssetsBodyProps) {
  if (status === "error") {
    return <CardAssetsEmptyState variant="error" onRetry={onRetryPress} />;
  }

  if (status === "empty") {
    return (
      <CardAssetsEmptyState variant="empty" onRetry={onRetryPress} onAddAsset={onAddAssetPress} />
    );
  }

  if (status === "loading") {
    return (
      <Box testID="card-assets-loading-state">
        <Skeleton component="list-item" />
        <Skeleton component="list-item" />
        <Skeleton component="list-item" />
      </Box>
    );
  }

  return (
    <Box lx={{ gap: "s8" }}>
      {rows.map(row => (
        <CardAssetRow key={row.id} row={row} onPress={onAssetPress} />
      ))}
    </Box>
  );
}
