import React from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import { ArrowUp, PenEdit, Trash } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";
import type { Contact, ContactEntry } from "~/renderer/contacts/types";
import { getChainInfo } from "../utils/getChainInfo";
import { QrCodeWithIcon } from "./QrCodeWithIcon";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  entry: ContactEntry | null;
};

type ActionId = "send" | "edit" | "delete";

type Action = {
  id: ActionId;
  i18nKey: string;
  icon: ComponentType<{ size?: 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56; className?: string }>;
  destructive?: boolean;
};

const ACTIONS: Action[] = [
  { id: "send", i18nKey: "contactsManagement.addressDialog.send", icon: ArrowUp },
  { id: "edit", i18nKey: "contactsManagement.addressDialog.edit", icon: PenEdit },
  { id: "delete", i18nKey: "contactsManagement.addressDialog.delete", icon: Trash, destructive: true },
];

const noop = () => {};

/**
 * Address detail dialog opened by clicking an `AddressRow`.
 *
 * Matches Figma frame 13844:9651 (dialog-sheet at instance 13844:10015):
 * - Lumen `Dialog` shell (header + body, no global footer).
 * - Header title = contact name.
 * - Body, centered: QR code of the full address with the chain's
 *   `CryptoIcon` punched into the center, the user's `scope` label,
 *   the FULL (non-truncated) address, and three action tiles in a row
 *   — Send, Edit, Delete (destructive).
 *
 * Action tiles are inert in L4 — they carry hover/pressed/focus states
 * from Lumen tokens but don't fire any side-effect. Wiring lands in
 * L4.1 alongside the AddressRowMenu wiring.
 *
 * TODO(contacts-L4.1):
 *   - "Send"   → route to /send with recipient pre-filled.
 *   - "Edit"   → useContacts().editAddress(...)
 *   - "Delete" → no DMK verb yet; flag when the API surface ships.
 */
export function AddressDetailDialog({ open, onOpenChange, contact, entry }: Props) {
  const { t } = useTranslation();

  if (!entry) return null;
  const chain = getChainInfo(entry.chainId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} height="fit">
      <DialogContent>
        <DialogHeader title={contact.name} onClose={() => onOpenChange(false)} />
        <DialogBody scrollbarWidth="auto" className="flex flex-col items-center gap-24 px-24 pb-24">
          <QrCodeWithIcon data={entry.addressHex} chainId={entry.chainId} />

          <div className="flex w-full flex-col items-center gap-4 text-center">
            <p className="heading-5-semi-bold text-base">{entry.scope}</p>
            <p
              data-testid="contacts-management-address-full"
              // `break-all` so a long 0x hex wraps mid-word instead of
              // overflowing — full address is the explicit requirement
              // here (no truncation).
              className="body-3 text-muted break-all"
            >
              {entry.addressHex}
            </p>
            <p className="body-3 text-muted">{chain.label}</p>
          </div>

          <div className="flex w-full items-stretch gap-8">
            {ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={noop}
                  data-testid={`contacts-management-address-dialog-${action.id}`}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-8 rounded-md p-16",
                    "bg-muted-transparent transition-colors",
                    "hover:bg-muted-transparent-hover active:bg-muted-transparent-pressed",
                    "focus-visible:outline-2 focus-visible:outline-focus",
                    "cursor-pointer",
                  )}
                >
                  <Icon
                    size={24}
                    className={action.destructive ? "text-error" : "text-base"}
                  />
                  <span
                    className={cn(
                      "body-2-semi-bold",
                      action.destructive ? "text-error" : "text-base",
                    )}
                  >
                    {t(action.i18nKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
