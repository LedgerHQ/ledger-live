import React, { useCallback, useState } from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import {
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ledgerhq/lumen-ui-react";
import {
  MoreHorizontal,
  PenEdit,
  Trash,
} from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";

/**
 * Top-right overflow menu on the contact details pane.
 *
 * Matches Figma frame 13980:9313:
 * - Trigger: `IconButton` (`appearance="gray"`) wrapping the
 *   `MoreHorizontal` symbol. We use `appearance="gray"` (not
 *   `no-background` like the per-row menu) so the button keeps its
 *   visible chip-style chrome matching the sibling `+` IconButton.
 * - Container, items, shadow: same layout primitives as
 *   `AddressRowMenu` — see that file for the shared rationale.
 *
 * Actions (both inert in L4 — `noop` keeps hover/pressed states on):
 *   1. Edit contact   — PenEdit
 *   2. Delete contact — Trash, text-error (destructive)
 *
 * TODO(contacts-L4.1):
 *   - "Edit contact"   → useContacts().renameContact(deviceId, …) via
 *                        a Lumen Dialog with a name input.
 *   - "Delete contact" → no DMK verb today; the local wallet entry is
 *                        dropped via useContacts().removeContact, the
 *                        on-device group lingers until the API ships.
 */

type ActionId = "edit" | "delete";

type Action = {
  id: ActionId;
  i18nKey: string;
  icon: ComponentType<{ size?: 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56; className?: string }>;
  destructive?: boolean;
};

const ACTIONS: Action[] = [
  { id: "edit", i18nKey: "contactsManagement.contactMenu.edit", icon: PenEdit },
  { id: "delete", i18nKey: "contactsManagement.contactMenu.delete", icon: Trash, destructive: true },
];

type Props = {
  onEdit?: () => void;
  onDelete?: () => void;
  /**
   * Hide the destructive "Delete contact" row. Set to `false` for the
   * protected "me" identity — that contact can be renamed but never
   * deleted (the synthesizer would just recreate it on next render
   * anyway, so the user would see no effect).
   */
  canDelete?: boolean;
};

export function ContactMenu({ onEdit, onDelete, canDelete = true }: Props = {}) {
  const { t } = useTranslation();
  // Controlled state so we can close the popover BEFORE the parent
  // handler opens a dialog. With an uncontrolled popover the menu
  // outlived the click and rendered on top of the dialog's overlay —
  // looked broken because the overlay is supposed to dim everything
  // behind it. See the previous bug report (Edit-contact dialog with
  // a stuck "Edit / Delete" menu in front of the backdrop).
  const [open, setOpen] = useState(false);

  const handlers: Record<ActionId, (() => void) | undefined> = {
    edit: onEdit,
    delete: onDelete,
  };

  const handleAction = useCallback(
    (id: ActionId) => () => {
      setOpen(false);
      handlers[id]?.();
    },
    // `handlers` is rebuilt each render from the latest props, so we
    // intentionally inline it via the closure — depending on it would
    // recreate this callback every render anyway. The only stable
    // identities are the setOpen + the prop handlers themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onEdit, onDelete],
  );

  // Filter out the Delete row entirely when the contact is protected.
  // We don't render a disabled row — the menu would look surprising
  // with a single grayed-out item that can't ever activate.
  const visibleActions = canDelete ? ACTIONS : ACTIONS.filter(a => a.id !== "delete");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <IconButton
            appearance="gray"
            size="sm"
            icon={MoreHorizontal}
            aria-label={t("contactsManagement.contactActions")}
            data-testid="contacts-management-overflow"
          />
        }
      />
      <PopoverContent
        side="bottom"
        align="end"
        width="fit"
        className={cn(
          "flex flex-col gap-0 min-w-208",
          "bg-muted border border-muted-subtle rounded-sm p-8",
          // Two-layer drop shadow matching the Figma `box-shadow/sm`,
          // same as `AddressRowMenu` so the two menus visually match.
          "shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]",
        )}
      >
        {visibleActions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={handleAction(action.id)}
              data-testid={`contacts-management-contact-menu-${action.id}`}
              className={cn(
                "flex h-44 w-full items-center gap-12 rounded-sm px-8",
                "bg-base-transparent transition-colors",
                "hover:bg-base-transparent-hover active:bg-base-transparent-pressed",
                "focus-visible:outline-2 focus-visible:outline-focus",
                "body-2-semi-bold text-start cursor-pointer",
                action.destructive ? "text-error" : "text-base",
              )}
            >
              <Icon size={20} className={action.destructive ? "text-error" : "text-base"} />
              <span className="min-w-0 flex-1 truncate">{t(action.i18nKey)}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
