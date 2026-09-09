import React from "react";
import { ListItem, Spot } from "@ledgerhq/lumen-ui-rnative";
import { Asterisk, ExitLogout, Question, Settings } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { MoreRowId } from "../types";

export { ListItemContent, ListItemLeading, ListItemTitle } from "@ledgerhq/lumen-ui-rnative";

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
    <ListItem onPress={onPress} testID={`more-row-${rowId}`}>
      {children}
    </ListItem>
  );
}

export function MoreIcon({ rowId }: Readonly<{ rowId: MoreRowId }>) {
  return <Spot appearance="icon" icon={ROW_ICONS[rowId]} size={48} />;
}
