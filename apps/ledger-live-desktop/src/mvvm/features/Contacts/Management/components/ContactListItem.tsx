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
 * visual = per-name InitialsAvatar.
 *
 * Selected state: `bg-active-subtle` — the `--background-active-subtle`
 * token used by the Figma frame 13802:2833 (`#251a31`, the purple). Lumen
 * `ListItem` ships no built-in `selected` variant at the pinned version,
 * so we override `className`.
 *
 * TODO(lumen-adoption): swap to a real "selected" variant if/when Lumen
 * ships one for ListItem.
 */
export function ContactListItem({ contact, isSelected, onSelect }: Props) {
  const { t } = useTranslation();
  const count = contact.entries.length;

  return (
    <ListItem
      density="expanded"
      onClick={() => onSelect(contact.name)}
      className={cn(
        "cursor-pointer",
        isSelected ? "bg-active-subtle" : "bg-transparent",
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
