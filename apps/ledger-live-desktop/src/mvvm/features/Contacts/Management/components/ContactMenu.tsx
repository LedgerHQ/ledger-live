import React, { useCallback, useState } from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import {
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@ledgerhq/lumen-ui-react";
import {
  MoreHorizontal,
  PenEdit,
  Trash,
} from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";

/**
 * Overflow menu on the contact details pane header.
 *
 * Built on Lumen's `Menu` component (Figma master `14382:19427`) —
 * `MenuContent` ships the container chrome (rounded-sm, p-8, shadow-sm,
 * fade animations) and `MenuItem` the 44px row spec (px-8, gap-12,
 * `body-2-semi-bold`, hover/pressed transparent states), so the only
 * local additions are the Figma master's sheet background (no stroke)
 * and the destructive tint.
 *
 * Trigger: `IconButton` (`appearance="gray"`) wrapping the
 * `MoreHorizontal` symbol — the visible chip-style chrome matching the
 * sibling "Add address" pill.
 *
 * The content opens `side="bottom" align="start"` so the menu drops to
 * the RIGHT of the `…` trigger (left edges aligned, panel extending
 * rightward) instead of extending leftward over the header.
 *
 * Actions:
 *   1. Edit contact   — PenEdit
 *   2. Delete contact — Trash, text-error (destructive)
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
  // Controlled state so we can close the menu BEFORE the parent
  // handler opens a dialog. With an uncontrolled menu it outlived the
  // click and rendered on top of the dialog's overlay — looked broken
  // because the overlay is supposed to dim everything behind it.
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
    <Menu open={open} onOpenChange={setOpen}>
      <MenuTrigger
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
      <MenuContent
        side="bottom"
        align="start"
        className={cn(
          "min-w-208",
          // Figma master `14382:19427` uses a `canvas/sheet` background
          // (no stroke) on top of MenuContent's intrinsic `bg-muted`
          // chrome — tailwind-merge resolves the override.
          "bg-canvas-sheet",
        )}
      >
        {visibleActions.map(action => {
          const Icon = action.icon;
          return (
            <MenuItem
              key={action.id}
              onClick={handleAction(action.id)}
              data-testid={`contacts-management-contact-menu-${action.id}`}
              // MenuItem ships `text-base cursor-default`; flip to the
              // destructive tint + pointer cursor where needed.
              className={cn("cursor-pointer", action.destructive && "text-error")}
            >
              <Icon size={20} className={action.destructive ? "text-error" : "text-base"} />
              <span className="min-w-0 flex-1 truncate">{t(action.i18nKey)}</span>
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
}
