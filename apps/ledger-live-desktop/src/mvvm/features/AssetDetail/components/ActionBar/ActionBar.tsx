import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { ArrowDown, ArrowUp, Exchange, Minus, Plus } from "@ledgerhq/lumen-ui-react/symbols";
import type { ActionBarActionId, ActionBarViewModel } from "./useActionBarViewModel";

const ACTION_ICONS: Record<ActionBarActionId, typeof ArrowDown> = {
  swap: Exchange,
  receive: ArrowDown,
  buy: Plus,
  sell: Minus,
  send: ArrowUp,
};

type ActionBarViewProps = Readonly<{
  viewModel: ActionBarViewModel;
}>;

export function ActionBarView({ viewModel }: ActionBarViewProps) {
  return (
    <div className="flex flex-wrap items-center gap-12" data-testid="asset-detail-action-bar">
      {viewModel.actions.map(action => (
        <Button
          key={action.id}
          appearance={action.isHighlighted ? "base" : "transparent"}
          size="sm"
          icon={ACTION_ICONS[action.id]}
          onClick={action.onClick}
          disabled={action.isDisabled}
          className="rounded-full"
          data-testid={`asset-detail-action-${action.id}`}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
