import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { ExternalLink } from "@ledgerhq/lumen-ui-react/symbols";
import type { HelpSlots } from "../../types";
import type { HelpRowViewModel } from "../../useHelpViewModel";

export type HelpRowTrailingProps = Readonly<{ row: HelpRowViewModel; slots: HelpSlots }>;

export function HelpRowTrailing({ row, slots }: HelpRowTrailingProps) {
  switch (row.action) {
    case "external":
      return <ExternalLink size={20} className="text-muted" />;
    case "button":
      return (
        <Button
          appearance={row.destructive ? "red" : "gray"}
          size="sm"
          onClick={row.onPress}
          data-testid={`settings-help-${row.id}-button`}
        >
          {row.actionLabel}
        </Button>
      );
    case "slot":
      return slots[row.id];
  }
}
