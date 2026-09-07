import React from "react";
import { ListItem, Spot } from "@ledgerhq/lumen-ui-react";
import { Asterisk, ExitLogout, Question, Settings } from "@ledgerhq/lumen-ui-react/symbols";
import type { CardMoreRowId } from "./types";

export { ListItemContent, ListItemLeading, ListItemTitle } from "@ledgerhq/lumen-ui-react";

type SpotIcon = typeof Asterisk;

const ROW_ICONS: Readonly<Record<CardMoreRowId, SpotIcon>> = {
  managePin: Asterisk,
  accessBaanx: Settings,
  help: Question,
  logout: ExitLogout,
};

type CardMoreListItemProps = Readonly<{
  rowId: CardMoreRowId;
  onPress: () => void;
  children: React.ReactNode;
}>;

export function CardMoreListItem({ rowId, onPress, children }: CardMoreListItemProps) {
  return (
    <ListItem onClick={onPress} data-testid={`card-more-row-${rowId}`}>
      {children}
    </ListItem>
  );
}

export function CardMoreIcon({ rowId }: Readonly<{ rowId: CardMoreRowId }>) {
  return <Spot appearance="icon" icon={ROW_ICONS[rowId]} size={48} />;
}
