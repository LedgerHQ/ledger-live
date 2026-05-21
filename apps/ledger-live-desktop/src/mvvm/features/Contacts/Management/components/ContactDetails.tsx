import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { MoreHorizontal, Plus } from "@ledgerhq/lumen-ui-react/symbols";
import type { Contact, ContactEntry } from "~/renderer/contacts/types";
import { groupAddressesByChain } from "../utils/groupAddressesByChain";
import { AddressDetailDialog } from "./AddressDetailDialog";
import { AddressRow } from "./AddressRow";
import { InitialsAvatar } from "./InitialsAvatar";

type Props = {
  contact: Contact;
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
 * - Address sections: addresses grouped by chain (see
 *   `groupAddressesByChain`), each section is a small label + a rounded
 *   `bg-surface-transparent` container wrapping the rows. Clicking a row
 *   opens the `AddressDetailDialog` with that entry (Figma frame
 *   13844:9651 dialog-sheet).
 *
 * Dialog open state lives here so a single dialog instance handles every
 * row in the pane.
 *
 * If the selected contact has zero entries (e.g. the synthetic "me"
 * placeholder), the address sections are suppressed entirely — the empty
 * state lands in a follow-up.
 */
export function ContactDetails({ contact }: Props) {
  const { t } = useTranslation();
  const count = contact.entries.length;
  const sections = groupAddressesByChain(contact.entries);

  // `null` = closed; otherwise points at the entry whose detail dialog
  // is showing. We keep the previous entry in state while the dialog is
  // animating out so the body still has data to render — Lumen's
  // `onOpenChange(false)` just clears the entry on the next commit.
  const [activeEntry, setActiveEntry] = useState<ContactEntry | null>(null);

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
          data-testid="contacts-management-add-address"
        />
        <IconButton
          appearance="gray"
          size="sm"
          aria-label={t("contactsManagement.contactActions")}
          icon={MoreHorizontal}
          data-testid="contacts-management-overflow"
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

      {/* Address sections grouped by chain. */}
      {sections.length > 0 && (
        <div className="flex flex-col gap-24 w-full">
          {sections.map(section => (
            <div key={section.chainId} className="flex flex-col gap-8 w-full">
              <p className="body-3 text-muted">{section.shortLabel}</p>
              {/*
                Figma frame 13827:32002 wraps each chain's address rows in
                a `--surface-transparent` (5% white) rounded box that sits
                as a subtle tinted card on top of the now-opaque
                `bg-surface` details pane.
              */}
              <div className="flex flex-col bg-surface-transparent rounded-lg p-4">
                {section.entries.map(entry => (
                  <AddressRow
                    key={`${entry.chainId}:${entry.addressHex}`}
                    entry={entry}
                    onSelect={setActiveEntry}
                  />
                ))}
              </div>
            </div>
          ))}
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
    </div>
  );
}
