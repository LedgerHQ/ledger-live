import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight, PenEditWriting, Shapes, Trash } from "@ledgerhq/lumen-ui-react/symbols";
import type { AccountSettingsMenuViewProps } from "./types";

export function AccountSettingsMenuView({
  accountName,
  labels,
  onChangeName,
  onViewAdvancedLogs,
  onRemoveAccount,
}: AccountSettingsMenuViewProps) {
  return (
    <div className="-mx-8 flex flex-col" data-testid="account-settings-menu">
      <ListItem priority="start" onClick={onChangeName} data-testid="account-settings-change-name">
        <ListItemLeading>
          <PenEditWriting size={20} />
          <ListItemContent>
            <ListItemTitle>{labels.changeName}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing className="gap-8">
          <span className="truncate body-2-semi-bold text-muted" title={accountName}>
            {accountName}
          </span>
          <ChevronRight size={16} className="text-muted" />
        </ListItemTrailing>
      </ListItem>
      <ListItem onClick={onViewAdvancedLogs} data-testid="account-settings-advanced-logs">
        <ListItemLeading>
          <Shapes size={20} />
          <ListItemContent>
            <ListItemTitle>{labels.viewAdvancedLogs}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing>
          <ChevronRight size={16} className="text-muted" />
        </ListItemTrailing>
      </ListItem>
      <ListItem onClick={onRemoveAccount} data-testid="account-settings-remove-account">
        <ListItemLeading>
          <Trash size={20} className="text-error" />
          <ListItemContent>
            <ListItemTitle className="text-error">{labels.removeAccount}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing>
          <ChevronRight size={16} className="text-muted" />
        </ListItemTrailing>
      </ListItem>
    </div>
  );
}
