import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { AmountScreenQuickAction } from "../types";

type QuickActionsRowProps = Readonly<{
  actions: AmountScreenQuickAction[];
}>;

export function QuickActionsRow({ actions }: QuickActionsRowProps) {
  return (
    <div className="-mt-12 flex w-full gap-12">
      {actions.map(action => (
        <Button
          key={action.id}
          appearance={action.active ? "accent" : "gray"}
          size="sm"
          disabled={action.disabled}
          onClick={action.onClick}
          className="min-w-0 flex-1"
          data-testId={`send-quick-actions-${action.id}`}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
