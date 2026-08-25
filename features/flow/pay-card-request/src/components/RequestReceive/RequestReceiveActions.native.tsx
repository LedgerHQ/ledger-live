import React from "react";
import { Box, TileButton } from "@ledgerhq/lumen-ui-rnative";
import { useRequestReceiveActions } from "./useRequestReceiveActions.native";
import type { RequestReceiveActionId, RequestReceiveActionLabels } from "../../types";

type RequestReceiveActionsProps = Readonly<{
  labels: RequestReceiveActionLabels;
  visibleActions: readonly RequestReceiveActionId[];
  hasCopied: boolean;
  onShare: () => void;
  onCopy: () => void;
  onSave: () => void;
  onVerify: () => void;
}>;

export function RequestReceiveActions(props: RequestReceiveActionsProps) {
  const tiles = useRequestReceiveActions(props);

  return (
    <Box lx={{ flexDirection: "row", gap: "s8", width: "full" }}>
      {tiles.map(tile => (
        <TileButton
          key={tile.id}
          lx={{ flex: 1 }}
          icon={tile.icon}
          onPress={tile.onClick}
          testID={tile.testId}
          accessibilityLabel={tile.label}
          isFull
        >
          {tile.label}
        </TileButton>
      ))}
    </Box>
  );
}
