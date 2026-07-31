import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";
import { resolveMeContactDisplayName } from "../../../utils";
import type { ContactDetailViewProps } from "../types";
import { ContactDetailAvatar } from "./ContactDetailAvatar.web";

type ContactDetailHeaderProps = Pick<
  ContactDetailViewProps,
  "contact" | "labels" | "meAvatarSrc" | "onAddAddress"
>;

export function ContactDetailHeader({
  contact,
  labels,
  meAvatarSrc,
  onAddAddress,
}: ContactDetailHeaderProps): React.ReactNode {
  const displayName = resolveMeContactDisplayName(
    contact,
    labels.formatMeDisplayName ?? (name => name),
  );
  const addAddressLabel = contact.isMe
    ? (labels.addExternalAddress ?? labels.addAddress)
    : labels.addAddress;

  return (
    <div className="flex flex-col items-center gap-24 pt-24">
      <div className="flex flex-col items-center gap-16">
        <ContactDetailAvatar contact={contact} meAvatarSrc={meAvatarSrc} />
        <div className="flex flex-col items-center gap-4">
          <h2 className="heading-3-semi-bold text-base" data-testid="contacts-detail-name">
            {displayName}
          </h2>
          <p className="body-2 text-muted">{labels.formatAddressCount(contact.addresses.length)}</p>
        </div>
      </div>
      <Button
        appearance="gray"
        size="sm"
        icon={Plus}
        onClick={onAddAddress}
        data-testid="contacts-detail-add-address"
      >
        {addAddressLabel}
      </Button>
    </div>
  );
}
