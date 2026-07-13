import React from "react";
import {
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemTrailing,
  ListItemDescription,
  Spot,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import { BookOpen, ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";

export type ContactsButtonProps = {
  title: string;
  description: string;
  newBadgeLabel?: string;
  onClick: () => void;
};

export function ContactsButton({
  title,
  description,
  newBadgeLabel,
  onClick,
}: Readonly<ContactsButtonProps>) {
  return (
    <ListItem onClick={onClick} className="bg-surface" data-testid="my-wallet-contacts-button">
      <ListItemLeading>
        <Spot icon={BookOpen} appearance="icon" />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription>{description}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        {newBadgeLabel ? (
          <Tag
            label={newBadgeLabel}
            appearance="accent"
            size="md"
            data-testid="contacts-button-new-badge"
          />
        ) : null}
        <ChevronRight size={24} />
      </ListItemTrailing>
    </ListItem>
  );
}
