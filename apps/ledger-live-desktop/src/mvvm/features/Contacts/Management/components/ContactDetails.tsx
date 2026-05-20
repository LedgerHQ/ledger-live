import React from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { MoreHorizontal, Plus } from "@ledgerhq/lumen-ui-react/symbols";
import type { Contact } from "~/renderer/contacts/types";
import { InitialsAvatar } from "./InitialsAvatar";
import { AddressRow } from "./AddressRow";

type Props = {
  contact: Contact;
};

/**
 * Right pane: large avatar + name + address-count subtitle, with two
 * icon-buttons in the top-right corner (add address, overflow menu), and
 * the list of addresses below.
 *
 * Both icon-buttons are intentionally NOT wired in L4 — the row's
 * `onClick` is omitted so Lumen's hover/press tokens still render. The
 * address rows themselves are also non-interactive in L4 (display-only).
 *
 * TODO(contacts-L4.1): wire the "+" button to "Add address to contact"
 *   (uses `useContacts().addAddressToContact`).
 * TODO(contacts-L4.1): wire the "…" button to an overflow Lumen
 *   DropdownMenu (rename, delete, edit address).
 */
export function ContactDetails({ contact }: Props) {
  const { t } = useTranslation();
  const count = contact.entries.length;

  return (
    <div
      className="flex flex-col gap-16 flex-1 min-w-0 h-full overflow-y-auto px-32 py-24"
      data-testid="contacts-management-details"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col items-start gap-12">
          <InitialsAvatar name={contact.name} size="lg" />
          <div className="flex flex-col gap-4">
            <h2 className="heading-3 text-base">{contact.name}</h2>
            <p className="body-2 text-muted">
              {t("contactsManagement.addresses", { count })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <IconButton
            appearance="gray"
            size="md"
            aria-label={t("contactsManagement.addAddress")}
            icon={Plus}
            data-testid="contacts-management-add-address"
          />
          <IconButton
            appearance="gray"
            size="md"
            aria-label={t("contactsManagement.contactActions")}
            icon={MoreHorizontal}
            data-testid="contacts-management-overflow"
          />
        </div>
      </div>

      {count > 0 && (
        <div className="flex flex-col gap-4">
          {contact.entries.map(entry => (
            <AddressRow key={`${entry.chainId}:${entry.addressHex}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
