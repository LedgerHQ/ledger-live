import React, { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  Tag,
  TileButton,
} from "@ledgerhq/lumen-ui-react";
import { ArrowUp, PenEdit, Trash } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";
import type { Contact, ContactEntry } from "~/renderer/contacts/types";
import type { CryptoOption } from "~/mvvm/features/Contacts/constants/topCryptos";
import { getChainInfo } from "../utils/getChainInfo";
import { CryptoIcon } from "@ledgerhq/crypto-icons";

/**
 * Wrap the destructive `Trash` symbol with an inline `color` style so
 * the icon goes red alongside the "Delete" label. Lumen `TileButton`
 * bakes `text-base` directly onto the icon element (see TileButton.js
 * line 74 — `className={k(...)}` only, no spread of extra props from
 * the caller's `className`), which our outer `text-error` className
 * can't override via the cascade. Inline `style` has higher specificity
 * than any utility class, so `currentColor` on the SVG strokes picks
 * up the error color cleanly.
 */
const DestructiveTrash = (props: {
  className?: string;
  size?: 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56;
}) => <Trash {...props} style={{ color: "var(--text-error)" }} />;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  entry: ContactEntry | null;
  /**
   * The crypto this address is grouped under (USDC, ETH, …) — resolved
   * by the parent `ContactDetails` via `groupAddressesByCrypto`. Drives
   * the centre coin icon + chain badge so the dialog stays in sync with
   * the source row. Optional for safety in tests / legacy callers; when
   * omitted the icon falls back to the chain's native gas token with no
   * network badge.
   */
  crypto?: CryptoOption;
  /**
   * Fired when the user clicks the "Edit" action tile. The parent is
   * expected to close this dialog and open the merged `EditAddressDialog`
   * (address + name) with the same entry.
   */
  onEdit?: () => void;
  /**
   * Fired when the user clicks the "Delete" action tile. The parent is
   * expected to close this dialog and open `DeleteAddressDialog` (the
   * confirmation modal) with the same entry — mirroring the per-row
   * overflow menu's "Delete address" path. The remaining tile (Send)
   * stays inert until L4.1 wires it.
   */
  onDelete?: () => void;
};

type ActionId = "send" | "edit" | "delete";

type Action = {
  id: ActionId;
  i18nKey: string;
  icon: ComponentType<{ size?: 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56; className?: string }>;
  destructive?: boolean;
};

// Order is Send / Edit / Delete. "Edit" (pen) opens the merged
// EditAddressDialog, which changes the address hex AND/OR the per-entry
// name in one flow (the former separate "Rename" tile is folded in).
const ACTIONS: Action[] = [
  { id: "send", i18nKey: "contactsManagement.addressDialog.send", icon: ArrowUp },
  { id: "edit", i18nKey: "contactsManagement.addressDialog.edit", icon: PenEdit },
  { id: "delete", i18nKey: "contactsManagement.addressDialog.delete", icon: DestructiveTrash, destructive: true },
];

const noop = () => {};

/**
 * Address detail dialog opened by clicking an `AddressRow`.
 *
 * Matches Figma frame 13844:10015 (dialog-sheet):
 * - Lumen `Dialog` shell (header + body, no global footer).
 * - Header title = contact name.
 * - Body, centered:
 *     1. The resolved crypto's coin icon (64px) with the chain badge
 *        in the corner — the row's "double icon" scaled up.
 *     2. A `Tag` (md) carrying the network label (e.g. "Base Network").
 *     3. The user's `scope` label in `heading-3-semi-bold`.
 *     4. The FULL (non-truncated) address in `body-2`.
 *     5. Three Lumen `TileButton`s — Send / Edit / Delete
 *        (destructive `text-error` tint on the last one).
 *
 * Edit and Delete are wired to the host's dialog state; Send stays inert
 * in L4 (carries hover/pressed/focus chrome but fires no side-effect).
 *
 * Close-animation handling: we keep the most recently seen `entry` in
 * a local `stickyEntry` state so the dialog body has content to render
 * while it animates out. If we conditionally returned `null` on
 * `entry === null`, the close animation would unmount the body
 * instantly and the dialog would appear to vanish without the
 * intrinsic Radix/Lumen close transition.
 *
 * TODO(contacts-L4.1):
 *   - "Send"   → route to /send with recipient pre-filled.
 */
export function AddressDetailDialog({
  open,
  onOpenChange,
  contact,
  entry,
  crypto,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation();

  // Preserve the last non-null entry so the body keeps its data during
  // the close animation. Cleared on next entry only when a new one
  // arrives.
  const [stickyEntry, setStickyEntry] = useState<ContactEntry | null>(entry);
  useEffect(() => {
    if (entry) setStickyEntry(entry);
  }, [entry]);

  if (!stickyEntry) return null;
  const chain = getChainInfo(stickyEntry.chainId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} height="fit">
      <DialogContent>
        <DialogHeader title={contact.name} onClose={() => onOpenChange(false)} />
        <DialogBody
          scrollbarWidth="auto"
          // Figma 13844:10015 rhythm: 24px top inset, then the
          // icon+text group, then a 40px gap down to the action tiles.
          className="flex flex-col items-center gap-40 px-24 pt-24 pb-24"
        >
          <div className="flex w-full flex-col items-center gap-32">
            {/*
              Coin + network double icon (64px) — replaces the QR code
              (Figma 13844:10015). Same resolution rule as AddressRow:
              prefer the crypto resolved by the grouping layer with the
              chain badge in the corner; fall back to the chain's native
              gas token (no badge — it would just stack the same glyph
              on itself) when the caller didn't carry the crypto.
            */}
            <div data-testid="contacts-management-address-coin">
              <CryptoIcon
                ticker={crypto?.ticker ?? chain.ticker}
                ledgerId={crypto?.ledgerId ?? chain.ledgerId}
                network={crypto ? chain.ledgerId : undefined}
                size={64}
                alt={crypto?.name ?? chain.shortLabel}
              />
            </div>

            <div className="flex w-full flex-col items-center gap-8 text-center">
              {/*
                Network tag — `md` (px-8 py-4, body-3) matches the 24px
                tag in the Figma frame, anchored above the scope name
                with an 8 px gap to the heading.
              */}
              <Tag
                size="md"
                appearance="gray"
                label={chain.label}
                data-testid="contacts-management-address-network-tag"
              />
              {/* Account name — Figma calls for heading/3-semi-bold. */}
              <p className="heading-3-semi-bold text-base">{stickyEntry.scope}</p>
              {/* Full untruncated address — Figma calls for body/2. */}
              <p
                data-testid="contacts-management-address-full"
                // `break-all` so the long 0x hex wraps mid-word instead of
                // overflowing — full address is the explicit requirement
                // here (no truncation). Fixed 264px width (Figma) so the
                // hex wraps to a consistent column regardless of the
                // dialog's intrinsic width; `mx-auto` keeps it centered.
                // Arbitrary `[264px]` because the Lumen spacing scale has
                // no 264 step (it tops out around 256).
                className="body-2 text-muted break-all w-[264px] mx-auto"
              >
                {stickyEntry.addressHex}
              </p>
            </div>
          </div>

          <div className="flex w-full items-stretch gap-8">
            {ACTIONS.map(action => {
              // Per-action dispatch. Edit / Delete are wired through to
              // the host's dialog state machinery (Edit opens the merged
              // EditAddressDialog; Delete opens the same confirmation
              // modal as the per-row overflow menu); Send stays inert.
              const handler =
                action.id === "edit"
                  ? onEdit
                  : action.id === "delete"
                    ? onDelete
                    : undefined;
              return (
              <TileButton
                key={action.id}
                icon={action.icon}
                onClick={handler ?? noop}
                isFull
                aria-label={t(action.i18nKey)}
                data-testid={`contacts-management-address-dialog-${action.id}`}
                // TileButton has no destructive variant at the pinned
                // Lumen version — apply `text-error` via className for
                // both the icon (via currentColor) and the label.
                className={cn(action.destructive && "text-error")}
              >
                {t(action.i18nKey)}
              </TileButton>
              );
            })}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
