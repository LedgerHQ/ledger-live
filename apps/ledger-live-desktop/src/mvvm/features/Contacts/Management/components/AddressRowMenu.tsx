import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
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
  QrCode,
  Trash,
} from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";
import { RenameLettersIcon } from "./icons/RenameLettersIcon";

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
 *   1. See QR Code          — QrCode
 *   2. Send to this address — ArrowUp
 *   3. Rename address       — RenameLetters (Figma `T+I` typography glyph)
 *   4. Edit address         — PenEdit
 *   5. Delete address       — Trash, text-error (destructive)
 *
 * TODO(contacts-L4.1): wire each item:
 *   - "See QR Code"          → open a Lumen Dialog rendering a QR code
 *                              of `entry.addressHex`
 *   - "Send to this address" → navigate to the Send flow with the
 *                              recipient pre-filled
 *   - "Rename address"       → useContacts().editAddressLabel(...) —
 *                              renames just the local label/`scope`
 *                              for this entry (no on-device prompt)
 *   - "Edit address"         → useContacts().editAddress(...)
 *   - "Delete address"       → not yet a DMK verb; flag when the API
 *                              surface ships
 */

type ActionId = "qr" | "send" | "rename" | "edit" | "delete";

type Action = {
  id: ActionId;
  i18nKey: string;
  icon: ComponentType<{ size?: 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56; className?: string }>;
  /** Destructive tint — applied to the "Delete address" entry only. */
  destructive?: boolean;
};

const ACTIONS: Action[] = [
  { id: "qr", i18nKey: "contactsManagement.addressMenu.qrCode", icon: QrCode },
  { id: "send", i18nKey: "contactsManagement.addressMenu.send", icon: ArrowUp },
  {
    id: "rename",
    i18nKey: "contactsManagement.addressMenu.renameAddress",
    icon: RenameLettersIcon,
  },
  { id: "edit", i18nKey: "contactsManagement.addressMenu.editAddress", icon: PenEdit },
  { id: "delete", i18nKey: "contactsManagement.addressMenu.delete", icon: Trash, destructive: true },
];

type Props = {
  /**
   * Fired when the user picks "See QR Code". The host (`AddressRow`)
   * routes this through the same `onSelect` callback that opens the
   * address detail dialog when the row itself is clicked — so the
   * menu entry and the row click land on the exact same screen.
   * Optional: items not yet wired in L4.1 stay inert.
   */
  onShowQrCode?: () => void;
  /**
   * Fired when the user picks "Delete address". The host opens the
   * `DeleteAddressDialog` confirmation gate; the actual deletion is
   * deferred to that dialog's `onConfirm`.
   */
  onDeleteAddress?: () => void;
  /**
   * Fired when the user picks "Rename address". The host opens the
   * `RenameAddressDialog` which prompts for the new per-entry label.
   */
  onRenameAddress?: () => void;
};

/**
 * Imperative handle exposed via `ref`. The parent `AddressRow` uses
 * this to open the menu at the cursor on a right-click — the
 * `…` IconButton still self-opens via its own `onClick`, so both
 * gestures funnel through the same anchor + state.
 */
export type AddressRowMenuHandle = {
  /**
   * Open the menu anchored at the given client coordinates (e.g. the
   * `clientX/clientY` of a `contextmenu` event). The popover positions
   * itself with `side="bottom" align="start"`, so the menu's top-left
   * corner sits just below the cursor.
   */
  openAt: (x: number, y: number) => void;
};

export const AddressRowMenu = forwardRef<AddressRowMenuHandle, Props>(
  function AddressRowMenu({ onShowQrCode, onDeleteAddress, onRenameAddress }, ref) {
  const { t } = useTranslation();
  // Controlled state so the popover dismisses before any future
  // dialog (Rename / Edit / Delete address) renders its overlay.
  // Same rationale as `ContactMenu` — see the comment there. The
  // remaining items (Send / Rename / Edit / Delete) stay inert until
  // L4.1 wires them through additional props.
  const [open, setOpen] = useState(false);
  // Position of the invisible anchor that the Popover follows. Driven
  // by either the `…` IconButton's bounding rect (button-click path)
  // or the `contextmenu` event's clientX/Y (right-click path). The
  // anchor starts at (0,0) — irrelevant because `open` is false on
  // first paint.
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dismiss = () => setOpen(false);

  // Imperative API for external openers (e.g. right-click on the
  // host row). The host doesn't need to mirror the open state — we
  // own it — it just hands us the cursor coordinates.
  useImperativeHandle(
    ref,
    () => ({
      openAt: (x, y) => {
        setAnchorPoint({ x, y });
        setOpen(true);
      },
    }),
    [],
  );

  // `…` IconButton click — anchor at the button's bottom-left so the
  // popover hangs straight under it.
  const handleTriggerClick = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setAnchorPoint({ x: rect.left, y: rect.bottom });
    setOpen(true);
  };

  // Per-action dispatch — close the popover first (so any host dialog
  // doesn't render on top of the menu's overlay) then fire the
  // caller-supplied handler.
  const handlers: Record<ActionId, (() => void) | undefined> = {
    qr: onShowQrCode,
    send: undefined,
    rename: onRenameAddress,
    edit: undefined,
    delete: onDeleteAddress,
  };
  const handleAction = (id: ActionId) => () => {
    dismiss();
    handlers[id]?.();
  };

  return (
    <>
      {/*
        Visible `…` trigger button. We render it OUTSIDE the
        `PopoverTrigger` because the popover anchors to a separate
        invisible element (below) — the button's role here is just to
        set the anchor to its own bounding rect and flip `open`. That
        way left-click on the button and right-click on the row body
        both feed the same anchor pipeline.
      */}
      <IconButton
        ref={triggerRef}
        onClick={handleTriggerClick}
        appearance="no-background"
        size="sm"
        icon={MoreHorizontal}
        aria-label={t("contactsManagement.addressActions")}
        data-testid="contacts-management-address-actions"
      />
      <Popover open={open} onOpenChange={setOpen}>
        {/*
          Invisible 0×0 anchor positioned at the cursor (for
          right-click) or the `…` button's bottom-left (for the
          button-click path). `position: fixed` so the coordinates
          are in viewport space — same space as `MouseEvent.clientX/Y`
          and `getBoundingClientRect`. `pointer-events: none` so the
          anchor never intercepts a click.
        */}
        <PopoverTrigger
          render={
            <span
              aria-hidden="true"
              style={{
                position: "fixed",
                left: anchorPoint.x,
                top: anchorPoint.y,
                width: 0,
                height: 0,
                pointerEvents: "none",
              }}
            />
          }
        />
        <PopoverContent
          side="bottom"
          align="start"
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
                onClick={handleAction(action.id)}
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
    </>
  );
});
