import React from "react";
import { useTranslation } from "react-i18next";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";
import type { Contact } from "~/renderer/contacts/types";
import { InitialsAvatar } from "./InitialsAvatar";

type Props = {
  contact: Contact;
  isSelected: boolean;
  onSelect: (name: string) => void;
};

/**
 * One row in the contact list pane.
 *
 * Title = contact name. Description = pluralized address-count. Leading
 * visual = initials avatar. Selected state uses a tinted background since
 * Lumen `ListItem` ships no built-in selected variant at the pinned
 * version (verified in the exploration pass).
 */
export function ContactListItem({ contact, isSelected, onSelect }: Props) {
  const { t } = useTranslation();
  const count = contact.entries.length;

  return (
    <ListItem
      onClick={() => onSelect(contact.name)}
      className={cn(
        "bg-surface cursor-pointer",
        // TODO(lumen-adoption): swap to a real "selected" variant if Lumen
        // ships one. `bg-muted-transparent` is the closest tinted neutral
        // token; the designer's purple is pending a Lumen palette pick.
        isSelected && "bg-muted-transparent",
      )}
      aria-selected={isSelected}
      data-testid="contacts-management-list-item"
      data-selected={isSelected ? "true" : "false"}
    >
      <ListItemLeading>
        <InitialsAvatar name={contact.name} size="sm" />
        <ListItemContent>
          <ListItemTitle>{contact.name}</ListItemTitle>
          <ListItemDescription>
            {t("contactsManagement.addresses", { count })}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
