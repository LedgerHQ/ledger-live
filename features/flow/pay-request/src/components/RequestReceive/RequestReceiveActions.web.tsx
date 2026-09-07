import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import { useRequestReceiveActions } from "./useRequestReceiveActions.web";
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
    <div className="flex w-full flex-row gap-8">
      {tiles.map(tile => (
        <div key={tile.id} className="flex-1">
          <TileButton icon={tile.icon} isFull onClick={tile.onClick} data-testid={tile.testId}>
            {tile.label}
          </TileButton>
        </div>
      ))}
    </div>
  );
}
