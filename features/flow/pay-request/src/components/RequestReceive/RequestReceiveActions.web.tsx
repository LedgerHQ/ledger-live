import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import { useRequestReceiveActions } from "./useRequestReceiveActions.web";
import { RequestReceiveVerifyHint } from "./RequestReceiveVerifyHint.web";
import type {
  RequestReceiveActionId,
  RequestReceiveActionLabels,
  RequestReceiveVerifyHint as RequestReceiveVerifyHintProps,
} from "../../types";

type RequestReceiveActionsProps = Readonly<{
  labels: RequestReceiveActionLabels;
  visibleActions: readonly RequestReceiveActionId[];
  hasCopied: boolean;
  onShare: () => void;
  onCopy: () => void;
  onSave: () => void;
  onVerify: () => void;
  verifyHint?: RequestReceiveVerifyHintProps;
}>;

export function RequestReceiveActions(props: RequestReceiveActionsProps) {
  const { verifyHint } = props;
  const tiles = useRequestReceiveActions(props);

  return (
    <div className="flex w-full flex-row gap-8">
      {tiles.map(tile => {
        const button = (
          <TileButton icon={tile.icon} isFull onClick={tile.onClick} data-testid={tile.testId}>
            {tile.label}
          </TileButton>
        );

        if (tile.id === "verify" && verifyHint) {
          return (
            <RequestReceiveVerifyHint key={tile.id} {...verifyHint}>
              {button}
            </RequestReceiveVerifyHint>
          );
        }

        return (
          <div key={tile.id} className="flex-1">
            {button}
          </div>
        );
      })}
    </div>
  );
}
