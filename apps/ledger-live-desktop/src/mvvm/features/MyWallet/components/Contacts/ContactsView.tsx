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
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import { ContactsIcon } from "./icons/ContactsIcon";

export type ContactsViewProps = {
  title: string;
  description: string;
  onClick: () => void;
};

export function ContactsView({ title, description, onClick }: ContactsViewProps) {
  return (
    <ListItem onClick={onClick} className="bg-surface">
      <ListItemLeading>
        {/* TODO(lumen-adoption): swap to a Lumen Contacts symbol once it ships. */}
        <Spot icon={ContactsIcon} appearance="icon" />
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
