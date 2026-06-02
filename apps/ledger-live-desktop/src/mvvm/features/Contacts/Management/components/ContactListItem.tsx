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
import type { DisplayContact } from "../utils/groupContacts";
import { InitialsAvatar } from "./InitialsAvatar";

type Props = {
  contact: DisplayContact;
  isSelected: boolean;
  onSelect: (name: string) => void;
};

/**
 * One row in the contact list pane.
 *
 * Title = contact name. Description = pluralized address-count. Leading
 * visual = per-name `InitialsAvatar`.
 *
 * Selected state uses a translucent purple tint per Figma frame
 * `14052:10178` — `hsba(273, 37%, 100%, 0.12)`, which translates to
 * `rgba(213, 161, 255, 0.12)` (HSB→RGB on a purple with V=100% / S=37%,
 * 12% alpha so the row reads as a soft active surface on the dark
 * canvas). When `isSelected` is true we also omit `onClick` so Lumen's
 * `interactive` flag flips off and the row stops carrying hover /
 * pressed / focus styles plus the `cursor-pointer` (ListItem.js
 * applies all of those via the `interactive: !!onClick` variant).
 * The selected row reads as a stable "current" surface rather than a
 * clickable target.
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
      onClick={isSelected ? undefined : () => onSelect(contact.name)}
      // Non-selected rows inherit Lumen's intrinsic `bg-base-transparent`
      // (matches the Figma's `--background-base-transparent` on inactive
      // rows). Only override for the selected state.
      className={cn(isSelected && "bg-[rgba(213,161,255,0.12)]")}
      aria-selected={isSelected}
      data-testid="contacts-management-list-item"
      data-selected={isSelected ? "true" : "false"}
    >
      <ListItemLeading>
        <InitialsAvatar name={contact.name} size="sm" colorKey={contact.colorKey} />
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
