import React from "react";
import { ListItem, Spot } from "@ledgerhq/lumen-ui-react";
import { Asterisk, ExitLogout, Question, Settings } from "@ledgerhq/lumen-ui-react/symbols";
import type { MoreRowId } from "../types";

export { ListItemContent, ListItemLeading, ListItemTitle } from "@ledgerhq/lumen-ui-react";

type SpotIcon = typeof Asterisk;

const ROW_ICONS: Readonly<Record<MoreRowId, SpotIcon>> = {
  managePin: Asterisk,
  accessBaanx: Settings,
  help: Question,
  logout: ExitLogout,
};

type MoreListItemProps = Readonly<{
  rowId: MoreRowId;
  onPress: () => void;
  children: React.ReactNode;
}>;

export function MoreListItem({ rowId, onPress, children }: MoreListItemProps) {
  return (
    <ListItem onClick={onPress} data-testid={`more-row-${rowId}`}>
      {children}
    </ListItem>
  );
}

export function MoreIcon({ rowId }: Readonly<{ rowId: MoreRowId }>) {
  return <Spot appearance="icon" icon={ROW_ICONS[rowId]} size={48} />;
}
