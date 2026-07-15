import React from "react";
import {
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Plus, UserCircle } from "@ledgerhq/lumen-ui-react/symbols";

export type ContactsAddContactButtonProps = {
  label: string;
};

export function ContactsAddContactButton({ label }: Readonly<ContactsAddContactButtonProps>) {
  return (
    <Button
      appearance="base"
      size="md"
      icon={Plus}
      disabled
      data-testid="contacts-add-contact-button"
      className="shrink-0 whitespace-nowrap"
    >
      {label}
    </Button>
  );
}

export type ContactsMeItemProps = {
  name: string;
  addressCountLabel: string;
};

export function ContactsMeItem({ name, addressCountLabel }: Readonly<ContactsMeItemProps>) {
  return (
    <ListItem className="bg-surface" data-testid="contacts-me-item">
      <ListItemLeading>
        <Spot icon={UserCircle} appearance="icon" />
        <ListItemContent>
          <ListItemTitle>{name}</ListItemTitle>
          <ListItemDescription>{addressCountLabel}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
