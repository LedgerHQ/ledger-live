import React from "react";
import { Button, Spot } from "@ledgerhq/lumen-ui-react";
import { Contact } from "@ledgerhq/lumen-ui-react/symbols";
import type { EmptyStateProps } from "../../types";

export function EmptyState({ info, addContactLabel, onAddContact }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center gap-24 text-center"
      data-testid="pay-contacts-empty-state"
    >
      <Spot appearance="icon" icon={Contact} size={72} />
      <p className="heading-4-semi-bold text-base">{info}</p>

      <Button onClick={onAddContact} size="sm" data-testid="pay-contacts-add-contact">
        {addContactLabel}
      </Button>
    </div>
  );
}
