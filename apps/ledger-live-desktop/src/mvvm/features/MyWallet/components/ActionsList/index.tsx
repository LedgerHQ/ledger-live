import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import { useActionsListViewModel } from "./useActionsListViewModel";

export function ActionsList() {
  const { actions } = useActionsListViewModel();
  return (
    <div className="flex gap-8 justify-between" data-testid="my-wallet-actions-list">
      {actions.map(({ icon, label, onClick, id }) => (
        <TileButton key={id} icon={icon} className="flex-1" onClick={onClick}>
          {label}
        </TileButton>
      ))}
    </div>
  );
}
