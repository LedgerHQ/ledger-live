import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { QuickAction } from "../types";

interface ActionsListProps {
  actionsList: QuickAction[];
}

export const ActionsList = ({ actionsList }: ActionsListProps) => {
  return (
    <div className="flex items-center gap-12" data-testid="quick-actions-actions-list">
      {actionsList.map(({ title, onAction, icon, disabled }, index) => (
        <Button
          key={index}
          appearance="base"
          size="sm"
          icon={icon}
          onClick={onAction}
          disabled={disabled}
          data-testid={`quick-action-button-${title.replace(/\s+/g, "-").toLowerCase()}`}
        >
          {title}
        </Button>
      ))}
    </div>
  );
};
