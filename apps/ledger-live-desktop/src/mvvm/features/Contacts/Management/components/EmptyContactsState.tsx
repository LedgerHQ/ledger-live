import React from "react";
import { useTranslation } from "react-i18next";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";

type Props = {
  onAddContact?: () => void;
};

/**
 * Empty state shown in the L4 Contacts list pane when the user has
 * no user-added contacts yet — Figma frame `14170:12350`.
 *
 * Rendered as a list-item row directly under the pinned Me row (not
 * the old centred card) so it visually invites the next action while
 * matching the existing list rhythm:
 *  - 40px circular `bg-muted` leading badge with a centred `Plus` glyph.
 *  - Title `"Add contact"` (`ListItemTitle` defaults to body-1-semi-bold).
 *  - Subtitle `"Send to a name instead of an address"` (muted).
 *  - Whole row clickable → opens the parent's `AddContactDialog`,
 *    same surface the header CTA drives.
 *
 * Wrapped in Lumen's `ListItem` so the hover/pressed/focus interaction
 * states match `ContactListItem` for free.
 */
export function EmptyContactsState({ onAddContact }: Props = {}) {
  const { t } = useTranslation();

  return (
    <ListItem
      density="expanded"
      onClick={onAddContact}
      data-testid="contacts-management-empty-contacts"
    >
      <ListItemLeading>
        {/*
          Match the `InitialsAvatar size="sm"` (40px) used by the
          sibling Me row so the leading column lines up. No ring —
          the Figma frame `14170:12350` calls for a flat `bg-muted`
          circle without the subtle white outline the real avatars
          carry.
        */}
        <div
          aria-hidden="true"
          className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-muted"
        >
          <Plus size={20} className="text-base" />
        </div>
        <ListItemContent>
          <ListItemTitle>{t("contactsManagement.emptyContacts.title")}</ListItemTitle>
          <ListItemDescription>
            {t("contactsManagement.emptyContacts.body")}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
