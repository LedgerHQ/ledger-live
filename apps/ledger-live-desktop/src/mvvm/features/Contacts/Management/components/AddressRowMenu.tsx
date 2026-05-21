import React from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import {
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ledgerhq/lumen-ui-react";
import {
  ArrowUp,
  MoreHorizontal,
  PenEdit,
  QrCodeScanner,
  Trash,
} from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";

/**
 * Per-row overflow menu in the contact details pane.
 *
 * Matches Figma frame 13909:3063:
 * - Trigger: `IconButton` (`appearance="no-background"`) wrapping the
 *   `MoreHorizontal` symbol — Lumen attaches hover, pressed, and
 *   focus-visible states automatically.
 * - Container: `bg-muted` (`--background-muted`), `border-muted-subtle`,
 *   `rounded-sm` (8px), `p-8`, with a drop shadow matching the
 *   `box-shadow/sm` token (two layered shadows).
 * - Items: hand-rolled 44px-tall buttons so the height matches the
 *   Figma exactly (Lumen `ListItem`'s closest density variants are 40px
 *   `compact` or 64px `expanded`). Each item carries `body-2-semi-bold`
 *   typography, a 20px leading icon, and Lumen's intrinsic
 *   `bg-base-transparent-hover` / `active:bg-base-transparent-pressed`
 *   styles for the interaction states.
 *
 * Actions (all inert in L4 — no-op onClick preserves the hover/pressed
 * states without firing any side-effect):
 *   1. See QR Code     — QrCodeScanner
 *   2. Send to this address — ArrowUp
 *   3. Edit address    — PenEdit
 *   4. Delete address  — Trash, text-error (destructive)
 *
 * TODO(contacts-L4.1): wire each item:
 *   - "See QR Code"          → open a Lumen Dialog rendering a QR code
 *                              of `entry.addressHex`
 *   - "Send to this address" → navigate to the Send flow with the
 *                              recipient pre-filled
 *   - "Edit address"         → useContacts().editAddress(...)
 *   - "Delete address"       → not yet a DMK verb; flag when the API
 *                              surface ships
 */

type ActionId = "qr" | "send" | "edit" | "delete";

type Action = {
  id: ActionId;
  i18nKey: string;
  icon: ComponentType<{ size?: 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56; className?: string }>;
  /** Destructive tint — applied to the "Delete address" entry only. */
  destructive?: boolean;
};

const ACTIONS: Action[] = [
  { id: "qr", i18nKey: "contactsManagement.addressMenu.qrCode", icon: QrCodeScanner },
  { id: "send", i18nKey: "contactsManagement.addressMenu.send", icon: ArrowUp },
  { id: "edit", i18nKey: "contactsManagement.addressMenu.editAddress", icon: PenEdit },
  { id: "delete", i18nKey: "contactsManagement.addressMenu.delete", icon: Trash, destructive: true },
];

// Empty handler so each row's `interactive` state is on (cursor +
// hover + pressed + focus). Functional wiring lands in L4.1.
const noop = () => {};

export function AddressRowMenu() {
  const { t } = useTranslation();

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
        className={cn(
          "flex flex-col gap-0 min-w-208",
          "bg-muted border border-muted-subtle rounded-sm p-8",
          // Two-layer drop shadow matching the Figma `box-shadow/sm`:
          //   (0,1) blur 3 + (0,1) blur 2 with -1 spread, both at 10% black.
          "shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]",
        )}
      >
        {ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={noop}
              data-testid={`contacts-management-address-menu-${action.id}`}
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
