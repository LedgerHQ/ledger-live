import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";
import type { Contact, ContactEntry } from "~/renderer/contacts/types";
import { groupAddressesByCrypto } from "../utils/groupAddressesByCrypto";
import { useCryptoMeta } from "../utils/cryptoMeta";
import { stripMeSuffix } from "../hooks/useManagementViewModel";
import { AddAddressDialog } from "./AddAddressDialog";
import { AddressDetailDialog } from "./AddressDetailDialog";
import { AddressRow } from "./AddressRow";
import { ContactMenu } from "./ContactMenu";
import { EditContactDialog } from "./EditContactDialog";
import { EmptyAddressState } from "./EmptyAddressState";
import { InitialsAvatar } from "./InitialsAvatar";

type Props = {
  contact: Contact;
  /** Other display names — used by EditContactDialog's duplicate check. */
  takenContactNames: string[];
  /** Whether the selected contact is the protected "me" identity. */
  isMe: boolean;
  /** Rename the displayed contact. Forwarded from the viewmodel. */
  onRenameContact: (currentDisplayName: string, newName: string) => void;
  /** Delete the displayed contact. Forwarded from the viewmodel. */
  onDeleteContact: (displayName: string) => void;
};

/**
 * Right pane of the Contacts management page.
 *
 * Layout (matches Figma frame 13802:2833):
 * - Outer container: rounded `bg-surface` panel with vertical stack,
 *   gap 32, padding 16/32.
 * - Header block (centered): large `InitialsAvatar` (96px) + name in
 *   `heading-3-semi-bold` + pluralized address-count in `body-2` text-muted.
 * - Top-right corner: two `IconButton`s (Plus + MoreHorizontal). Both
 *   intentionally non-wired in L4 — Lumen's hover/press states still
 *   render because we omit `disabled` and `onClick`. Wiring lands in L4.1.
 * - Address sections: grouped by CRYPTO (USDC, ETH, …) via
 *   `groupAddressesByCrypto`, which reads the sidecar `cryptoMeta`
 *   store (DEMO-only — see `utils/cryptoMeta.ts`) and falls back to
 *   each entry's chain-native gas token. Section header shows the
 *   crypto ticker; rows carry the crypto's icon with a chain dot
 *   badge in the corner.
 *
 * Dialog open state lives here so a single dialog instance handles every
 * row in the pane.
 *
 * If the selected contact has zero entries (e.g. the synthetic "me"
 * placeholder), the address sections are suppressed entirely — the empty
 * state lands in a follow-up.
 */
export function ContactDetails({
  contact,
  takenContactNames,
  isMe,
  onRenameContact,
  onDeleteContact,
}: Props) {
  const { t } = useTranslation();
  const count = contact.entries.length;
  // Subscribe once at the parent so each AddressRow's grouping
  // re-renders whenever the sidecar is updated (e.g. after registering
  // a new address via the L1 form).
  const cryptoMeta = useCryptoMeta();
  const sections = useMemo(
    () => groupAddressesByCrypto(contact.entries, cryptoMeta),
    [contact.entries, cryptoMeta],
  );

  // `null` = closed; otherwise points at the entry whose detail dialog
  // is showing. We keep the previous entry in state while the dialog is
  // animating out so the body still has data to render — Lumen's
  // `onOpenChange(false)` just clears the entry on the next commit.
  const [activeEntry, setActiveEntry] = useState<ContactEntry | null>(null);

  // Open state for the Add-Address Dialog flow — triggered by either
  // the `+` IconButton (top-right) or the empty-state CTA. The dialog
  // itself owns the step machine; we just toggle visibility.
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const openAddAddress = () => setAddAddressOpen(true);

  // Open state for the Edit-Contact rename Dialog. The dialog itself
  // pre-fills the current name; on submit it bubbles the new name
  // back into the viewmodel via `onRenameContact`.
  const [editContactOpen, setEditContactOpen] = useState(false);

  // Other display names — exclude the current contact so the dialog's
  // duplicate check treats "rename to same name" as a no-op rather
  // than a duplicate.
  const otherTakenNames = useMemo(
    () => takenContactNames.filter(n => n !== contact.name),
    [takenContactNames, contact.name],
  );

  return (
    <div
      data-testid="contacts-management-details"
      className="relative flex flex-col gap-32 h-full overflow-y-auto rounded-lg bg-surface px-16 py-32"
    >
      {/* Top-right icon buttons (absolute so they don't push the header). */}
      <div className="absolute top-16 right-16 flex items-center gap-8">
        <IconButton
          appearance="gray"
          size="sm"
          aria-label={t("contactsManagement.addAddress")}
          icon={Plus}
          onClick={openAddAddress}
          data-testid="contacts-management-add-address"
        />
        <ContactMenu
          onEdit={() => setEditContactOpen(true)}
          onDelete={() => onDeleteContact(contact.name)}
          // Protect the "me" contact from deletion. The menu hides the
          // Delete row entirely when this is false — `me` can be
          // renamed but never removed.
          canDelete={!isMe}
        />
      </div>

      {/* Centered identity block. */}
      <div className="flex flex-col items-center gap-16 w-full">
        <InitialsAvatar name={contact.name} size="lg" />
        <div className="flex flex-col items-center gap-4 w-full text-center">
          <h2 className="heading-3-semi-bold text-base">{contact.name}</h2>
          <p className="body-2 text-muted">
            {t("contactsManagement.addresses", { count })}
          </p>
        </div>
      </div>

      {/* Empty state — surfaced when the selected contact has no
          addresses (a freshly-added sidecar contact, or the synthetic
          "me" placeholder). Figma frame 13922:11258. */}
      {count === 0 && <EmptyAddressState onAddAddress={openAddAddress} />}

      {/* Address sections grouped by crypto.
          `unknown` entries (entries with no sidecar metadata AND no
          chain-native fallback for their chainId) are filtered out —
          in normal demo flow every EVM chain in the L1 form has a
          fallback, so this should never visibly drop anything. */}
      {sections.length > 0 && (
        <div className="flex flex-col gap-24 w-full">
          {sections
            .filter(section => section.cryptoId !== "unknown")
            .map(section => {
              if (section.cryptoId === "unknown") return null; // narrow
              return (
                <div key={section.cryptoId} className="flex flex-col gap-8 w-full">
                  <p className="body-3 text-muted">{section.crypto.ticker}</p>
                  {/*
                    Figma frame 13827:32002 wraps each section's rows in a
                    `--surface-transparent` (5% white) rounded box that
                    sits as a subtle tinted card on top of the now-opaque
                    `bg-surface` details pane.
                  */}
                  <div className="flex flex-col bg-surface-transparent rounded-lg p-4">
                    {section.entries.map(entry => (
                      <AddressRow
                        key={`${entry.chainId}:${entry.addressHex}`}
                        entry={entry}
                        crypto={section.crypto}
                        onSelect={setActiveEntry}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <AddressDetailDialog
        open={activeEntry !== null}
        onOpenChange={isOpen => {
          if (!isOpen) setActiveEntry(null);
        }}
        contact={contact}
        entry={activeEntry}
      />

      <AddAddressDialog
        open={addAddressOpen}
        onOpenChange={setAddAddressOpen}
        contact={contact}
      />

      <EditContactDialog
        open={editContactOpen}
        onOpenChange={setEditContactOpen}
        // For the "me" contact we pre-fill the input WITHOUT the
        // " (Me)" suffix — the user only edits the part they care
        // about, and the viewmodel re-appends the suffix on submit.
        currentName={isMe ? stripMeSuffix(contact.name) : contact.name}
        takenNames={otherTakenNames}
        onSubmit={newName => {
          setEditContactOpen(false);
          onRenameContact(contact.name, newName);
        }}
      />
    </div>
  );
}
