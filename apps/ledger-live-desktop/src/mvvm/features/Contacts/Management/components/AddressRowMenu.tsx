import React from "react";
import { useTranslation } from "react-i18next";
import {
  IconButton,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ledgerhq/lumen-ui-react";
import {
  Copy,
  MoreHorizontal,
  PenEdit,
  Refresh,
  Trash,
} from "@ledgerhq/lumen-ui-react/symbols";
import type { ComponentType } from "react";

/**
 * Per-row overflow menu in the contact details pane.
 *
 * Trigger: Lumen `IconButton` (`appearance="no-background"`) wrapping the
 * `MoreHorizontal` symbol — gives hover, pressed, and focus-visible
 * states from the design system without a Spot-like chrome circle.
 *
 * Content: Lumen `Popover` anchored on the trigger, containing four
 * `ListItem` rows (Copy address, Edit label, Edit address, Remove).
 *
 * Each row passes a no-op `onClick` so Lumen flips its `interactive`
 * flag on and applies `cursor-pointer hover:bg-base-transparent-hover
 * active:bg-base-transparent-pressed focus-visible:outline-…` (see
 * `ListItem.js` compound variant) — the row visibly responds to the
 * user but clicking is inert in L4. Wiring lands in L4.1.
 *
 * TODO(contacts-L4.1): hook each item to its DMK verb / clipboard call:
 *   - "Copy address"  → navigator.clipboard.writeText(entry.addressHex)
 *   - "Edit label"    → useContacts().editAddressLabel(...)
 *   - "Edit address"  → useContacts().editAddress(...)
 *   - "Remove"        → not yet a DMK verb; flag when the API surface
 *                       ships.
 */

type ActionId = "copy" | "edit-label" | "edit-address" | "remove";

type Action = {
  id: ActionId;
  i18nKey: string;
  icon: ComponentType<{ size?: 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56; className?: string }>;
  /** Optional destructive tint — applied to the "Remove" entry only. */
  destructive?: boolean;
};

const ACTIONS: Action[] = [
  { id: "copy", i18nKey: "contactsManagement.addressMenu.copy", icon: Copy },
  { id: "edit-label", i18nKey: "contactsManagement.addressMenu.editLabel", icon: PenEdit },
  { id: "edit-address", i18nKey: "contactsManagement.addressMenu.editAddress", icon: Refresh },
  { id: "remove", i18nKey: "contactsManagement.addressMenu.remove", icon: Trash, destructive: true },
];

export function AddressRowMenu() {
  const { t } = useTranslation();

  // Empty handler so Lumen's `interactive: !!onClick` variant adds the
  // hover/pressed/focus + cursor classes. Functional wiring lands in
  // L4.1.
  const noop = () => {};

  return (
    <Popover>
      <PopoverTrigger
        render={
          <IconButton
            appearance="no-background"
            size="sm"
            icon={MoreHorizontal}
            aria-label={t("contactsManagement.addressActions")}
            data-testid="contacts-management-address-actions"
          />
        }
      />
      <PopoverContent
        side="bottom"
        align="end"
        width="fit"
        className="flex flex-col p-4 min-w-200"
        data-testid="contacts-management-address-menu"
      >
        {ACTIONS.map(action => (
          <ListItem
            key={action.id}
            density="compact"
            onClick={noop}
            data-testid={`contacts-management-address-menu-${action.id}`}
          >
            <ListItemLeading>
              <action.icon size={20} className={action.destructive ? "text-error" : "text-base"} />
              <ListItemContent>
                <ListItemTitle className={action.destructive ? "text-error" : undefined}>
                  {t(action.i18nKey)}
                </ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
        ))}
      </PopoverContent>
    </Popover>
  );
}
