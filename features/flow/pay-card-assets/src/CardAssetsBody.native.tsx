import React from "react";
import { Box, Skeleton } from "@ledgerhq/lumen-ui-rnative";
import { CardAssetRow } from "./CardAssetRow";
import { CardAssetsEmptyState } from "./CardAssetsEmptyState";
import type { CardAssetsViewModel } from "./types";

type CardAssetsBodyProps = Readonly<
  Pick<CardAssetsViewModel, "status" | "rows" | "onOpenAsset" | "onRetry" | "onAddAsset">
>;

export function CardAssetsBody({
  status,
  rows,
  onOpenAsset,
  onRetry,
  onAddAsset,
}: CardAssetsBodyProps) {
  if (status === "error") {
    return <CardAssetsEmptyState variant="error" onRetry={onRetry} />;
  }

  if (status === "empty") {
    return <CardAssetsEmptyState variant="empty" onRetry={onRetry} onAddAsset={onAddAsset} />;
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
        <CardAssetRow key={row.id} row={row} onPress={onOpenAsset} />
      ))}
    </Box>
  );
}
