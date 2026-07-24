import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ContactDetailPageProps } from "../../types";
import { ContactDetailAvatar } from "./ContactDetailAvatar.native";

type ContactDetailHeaderProps = Pick<
  ContactDetailPageProps,
  "contact" | "labels" | "meAvatarSrc" | "onAddAddress"
>;

export function ContactDetailHeader({
  contact,
  labels,
  meAvatarSrc,
  onAddAddress,
}: ContactDetailHeaderProps): React.JSX.Element {
  return (
    <Box lx={{ alignItems: "center", gap: "s24", paddingTop: "s24" }}>
      <Box lx={{ alignItems: "center", gap: "s16" }}>
        <ContactDetailAvatar contact={contact} meAvatarSrc={meAvatarSrc} />
        <Box lx={{ alignItems: "center", gap: "s4" }}>
          <Text typography="heading3SemiBold" lx={{ color: "base" }}>
            {contact.name}
          </Text>
          <Text typography="body2" lx={{ color: "muted" }}>
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
        {labels.addAddress}
      </Button>
    </Box>
  );
}
