import React from "react";
import { IconButton, Menu, MenuContent, MenuItem, MenuTrigger } from "@ledgerhq/lumen-ui-react";
import { Settings } from "@ledgerhq/lumen-ui-react/symbols";
import type { DelegationAction } from "../components/AccountDelegations/AccountDelegations.types";

type Props = Readonly<{
  rowId: string;
  actions: readonly DelegationAction[];
  label: string;
  onSelect: (rowId: string, actionId: string) => void;
}>;

export const RowActionsMenu = ({ rowId, actions, label, onSelect }: Props) => (
  <Menu>
    <MenuTrigger
      render={
        <IconButton
          appearance="transparent"
          size="sm"
          icon={Settings}
          aria-label={label}
          data-testid={`delegation-row-${rowId}-actions`}
        />
      }
    />
    <MenuContent align="end">
      {actions.map(({ id, label: actionLabel, disabledReason }) => (
        <MenuItem
          key={id}
          disabled={disabledReason !== undefined}
          label={actionLabel}
          onClick={() => onSelect(rowId, id)}
          data-testid={`delegation-row-${rowId}-action-${id}`}
        >
          <span className="flex flex-col">
            <span>{actionLabel}</span>
            {disabledReason ? <span className="body-4 text-muted">{disabledReason}</span> : null}
          </span>
        </MenuItem>
      ))}
    </MenuContent>
  </Menu>
);
