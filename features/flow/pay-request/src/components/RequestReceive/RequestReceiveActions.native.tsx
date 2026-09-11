import React from "react";
import { Box, TileButton } from "@ledgerhq/lumen-ui-rnative";
import { useRequestReceiveActions } from "./useRequestReceiveActions.native";
import type { RequestReceiveActionId, RequestReceiveActionLabels } from "../../types";

const VERIFY_LAYER = 2;

type RequestReceiveActionsProps = Readonly<{
  labels: RequestReceiveActionLabels;
  visibleActions: readonly RequestReceiveActionId[];
  hasCopied: boolean;
  onShare: () => void;
  onCopy: () => void;
  onSave: () => void;
  onVerify: () => void;
  dimOtherActions?: boolean;
}>;

export function RequestReceiveActions(props: RequestReceiveActionsProps) {
  const { dimOtherActions } = props;
  const tiles = useRequestReceiveActions(props);

  return (
    <Box lx={{ flexDirection: "row", gap: "s8", width: "full" }}>
      {tiles.map(tile => {
        const isVerify = tile.id === "verify";
        return (
          <Box
            key={tile.id}
            lx={{ flex: 1 }}
            style={dimOtherActions && isVerify ? { zIndex: VERIFY_LAYER } : undefined}
          >
            <TileButton
              lx={{ width: "full" }}
              icon={tile.icon}
              onPress={tile.onClick}
              disabled={!!dimOtherActions && !isVerify}
              testID={tile.testId}
              accessibilityLabel={tile.label}
              isFull
            >
              {tile.label}
            </TileButton>
          </Box>
        );
      })}
    </Box>
  );
}
