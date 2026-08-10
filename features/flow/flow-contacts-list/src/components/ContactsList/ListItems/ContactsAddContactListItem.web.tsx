import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";

type ContactsAddContactListItemProps = Readonly<{
  label: string;
  onAddContact: () => void;
}>;

export function ContactsAddContactListItem({
  label,
  onAddContact,
}: ContactsAddContactListItemProps): React.ReactNode {
  return (
    <ListItem onClick={onAddContact} data-testid="contacts-add-contact">
      <ListItemLeading>
        <div
          className="flex size-48 shrink-0 items-center justify-center rounded-full bg-muted-transparent text-base"
          aria-hidden
        >
          <Plus size={20} />
        </div>
        <ListItemContent>
          <ListItemTitle>{label}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
