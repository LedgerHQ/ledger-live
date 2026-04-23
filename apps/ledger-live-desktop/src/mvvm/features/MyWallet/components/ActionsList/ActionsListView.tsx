import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import type { Action } from "./types";

export type ActionsListViewProps = {
  actions: Action[];
};

export function ActionsListView({ actions }: ActionsListViewProps) {
  return (
    <div className="flex gap-8 justify-between" data-testid="my-wallet-actions-list">
      {actions.map(({ icon, label, onClick, id }) => (
        <TileButton
          key={id}
          icon={icon}
          onClick={onClick}
          data-testid={`my-wallet-action-${id}`}
          isFull
        >
          {label}
        </TileButton>
      ))}
    </div>
  );
}
