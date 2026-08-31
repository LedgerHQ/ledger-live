import React from "react";
import { resolveMeContactDisplayName } from "@features/platform-contacts";
import type { ContactDetailViewProps } from "../../types";
import {
  ContactDetailActions,
  type ContactDetailActionsProps,
} from "../ContactDetailActions/ContactDetailActions.web";
import { ContactDetailHeaderAddAddress } from "./ContactDetailHeaderAddAddress.web";
import { ContactDetailHeaderIdentity } from "./ContactDetailHeaderIdentity.web";

type ContactDetailHeaderProps = Pick<
  ContactDetailViewProps,
  "contact" | "labels" | "meAvatarSrc" | "onAddAddress"
> &
  Readonly<{
    detailActions?: ContactDetailActionsProps;
    isCollapsed: boolean;
  }>;

function getCompactHeaderLayout(detailActions?: ContactDetailActionsProps): Readonly<{
  addAddressOffset: string;
  contentRight: string;
}> {
  if (detailActions?.canDelete) {
    return {
      addAddressOffset: "right-[120px]",
      contentRight: "right-[280px] @max-[500px]:right-[176px]",
    };
  }

  if (detailActions) {
    return {
      addAddressOffset: "right-[72px]",
      contentRight: "right-[232px] @max-[500px]:right-[128px]",
    };
  }

  return {
    addAddressOffset: "right-16",
    contentRight: "right-[176px] @max-[500px]:right-16",
  };
}

export function ContactDetailHeader({
  contact,
  labels,
  meAvatarSrc,
  onAddAddress,
  detailActions,
  isCollapsed,
}: ContactDetailHeaderProps): React.ReactNode {
  const displayName = resolveMeContactDisplayName(
    contact,
    labels.formatMeDisplayName ?? (name => name),
  );
  const addAddressLabel = contact.isMe
    ? (labels.addExternalAddress ?? labels.addAddress)
    : labels.addAddress;
  const { addAddressOffset, contentRight } = getCompactHeaderLayout(detailActions);

  return (
    <div
      className={`@container relative shrink-0 motion-safe:transition-[height] motion-safe:duration-[400ms] motion-safe:ease-in-out motion-reduce:transition-none ${
        isCollapsed ? "h-80 overflow-hidden" : "h-[216px] overflow-visible"
      }`}
      data-state={isCollapsed ? "collapsed" : "expanded"}
      data-testid="contacts-detail-header"
    >
      <ContactDetailHeaderIdentity
        contact={contact}
        meAvatarSrc={meAvatarSrc}
        name={displayName}
        addressCount={labels.formatAddressCount(contact.addresses.length)}
        isCollapsed={isCollapsed}
        compactContentRight={contentRight}
      />
      <ContactDetailHeaderAddAddress
        label={addAddressLabel}
        onAddAddress={onAddAddress}
        isCollapsed={isCollapsed}
        compactOffset={addAddressOffset}
      />
      {detailActions ? <ContactDetailActions {...detailActions} isCollapsed={isCollapsed} /> : null}
    </div>
  );
}
