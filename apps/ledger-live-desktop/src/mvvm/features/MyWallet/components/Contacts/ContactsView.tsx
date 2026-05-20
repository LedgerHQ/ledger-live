import React from "react";
import {
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemTrailing,
  ListItemDescription,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight, GroupUsers } from "@ledgerhq/lumen-ui-react/symbols";

export type ContactsViewProps = {
  title: string;
  description: string;
  onClick: () => void;
};

export function ContactsView({ title, description, onClick }: ContactsViewProps) {
  return (
    <ListItem onClick={onClick} className="bg-surface">
      <ListItemLeading>
        <Spot icon={GroupUsers} appearance="icon" />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription>{description}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ChevronRight size={24} />
      </ListItemTrailing>
    </ListItem>
  );
}
