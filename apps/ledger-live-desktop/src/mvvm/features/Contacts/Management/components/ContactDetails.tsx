import React from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { MoreHorizontal, Plus } from "@ledgerhq/lumen-ui-react/symbols";
import type { Contact } from "~/renderer/contacts/types";
import { groupAddressesByChain } from "../utils/groupAddressesByChain";
import { AddressRow } from "./AddressRow";
import { InitialsAvatar } from "./InitialsAvatar";

type Props = {
  contact: Contact;
};

/**
 * Right pane of the Contacts management page.
 *
 * Layout (matches Figma frame 13802:2833):
 * - Outer container: rounded `bg-surface-transparent` panel with vertical
 *   stack, gap 32, padding 16/32.
 * - Header block (centered): large `InitialsAvatar` (96px) + name in
 *   `heading-3-semi-bold` + pluralized address-count in `body-2` text-muted.
 * - Top-right corner: two `IconButton`s (Plus + MoreHorizontal). Both
 *   intentionally non-wired in L4 — Lumen's hover/press states still
 *   render because we omit `disabled` and `onClick`. Wiring lands in L4.1.
 * - Address sections: addresses grouped by chain (see
 *   `groupAddressesByChain`), each section is a small label + a rounded
 *   `bg-surface` container wrapping the rows.
 *
 * If the selected contact has zero entries (e.g. the synthetic "me"
 * placeholder), the address sections are suppressed entirely — the empty
 * state lands in a follow-up.
 */
export function ContactDetails({ contact }: Props) {
  const { t } = useTranslation();
  const count = contact.entries.length;
  const sections = groupAddressesByChain(contact.entries);

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
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
