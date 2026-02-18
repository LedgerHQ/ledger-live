import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { AmountScreenQuickAction } from "../types";

type QuickActionsRowProps = Readonly<{
  actions: AmountScreenQuickAction[];
}>;

export function QuickActionsRow({ actions }: QuickActionsRowProps) {
  return (
    <div className="-mt-12 flex w-full gap-12" data-testid="send-quick-actions-row">
      {actions.map(action => (
        <Button
          key={action.id}
          appearance={action.active ? "accent" : "gray"}
          size="sm"
          disabled={action.disabled}
          onClick={action.onClick}
          data-testid={`send-quick-actions-${action.id}`}
          className="min-w-0 flex-1"
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
