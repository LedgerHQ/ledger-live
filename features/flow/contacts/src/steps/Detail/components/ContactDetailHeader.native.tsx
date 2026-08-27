import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import { resolveMeContactDisplayName } from "@features/platform-contacts";
import type { ContactDetailViewProps } from "../types";
import { ContactDetailAvatar } from "./ContactDetailAvatar.native";

type ContactDetailHeaderProps = Pick<
  ContactDetailViewProps,
  "contact" | "labels" | "meAvatarSrc" | "onAddAddress"
>;

export function ContactDetailHeader({
  contact,
  labels,
  meAvatarSrc,
  onAddAddress,
}: ContactDetailHeaderProps): React.JSX.Element {
  const displayName = resolveMeContactDisplayName(
    contact,
    labels.formatMeDisplayName ?? (name => name),
  );

  return (
    <Box lx={{ alignItems: "center", gap: "s24", paddingTop: "s24" }}>
      <Box lx={{ alignItems: "center", gap: "s16" }}>
        <ContactDetailAvatar contact={contact} meAvatarSrc={meAvatarSrc} />
        <Box lx={{ alignItems: "center", gap: "s4" }}>
          <Text testID="contacts-detail-name" typography="heading3SemiBold" lx={{ color: "base" }}>
            {displayName}
          </Text>
          <Text testID="contacts-detail-address-count" typography="body2" lx={{ color: "muted" }}>
            {labels.formatAddressCount(contact.addresses.length)}
          </Text>
        </Box>
      </Box>
      <Button
        appearance="gray"
        size="sm"
        icon={Plus}
        onPress={onAddAddress}
        testID="contacts-detail-add-address"
      >
        {contact.isMe ? (labels.addYourAddress ?? labels.addAddress) : labels.addAddress}
      </Button>
    </Box>
  );
}
