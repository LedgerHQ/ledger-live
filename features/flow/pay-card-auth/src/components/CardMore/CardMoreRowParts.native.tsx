import React from "react";
import { ListItem, Spot } from "@ledgerhq/lumen-ui-rnative";
import { Asterisk, ExitLogout, Question, Settings } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { CardMoreRowId } from "./types";

export { ListItemContent, ListItemLeading, ListItemTitle } from "@ledgerhq/lumen-ui-rnative";

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
    <ListItem onPress={onPress} testID={`card-more-row-${rowId}`}>
      {children}
    </ListItem>
  );
}

export function CardMoreIcon({ rowId }: Readonly<{ rowId: CardMoreRowId }>) {
  return <Spot appearance="icon" icon={ROW_ICONS[rowId]} size={48} />;
}
