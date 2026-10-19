import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useContactDisplayName } from "@features/platform-contacts";
import type { ContactDetailViewProps } from "../types";
import { useContactDetailHeaderCopy } from "../copy/useContactDetailHeaderCopy";
import { ContactDetailAvatar } from "./ContactDetailAvatar.native";

type ContactDetailHeaderProps = Pick<ContactDetailViewProps, "contact" | "onAddAddress">;

export function ContactDetailHeader({
  contact,
  onAddAddress,
}: ContactDetailHeaderProps): React.JSX.Element {
  const getDisplayName = useContactDisplayName();
  const copy = useContactDetailHeaderCopy(contact);

  return (
    <Box lx={{ alignItems: "center", gap: "s24", paddingTop: "s24" }}>
      <Box lx={{ alignItems: "center", gap: "s16" }}>
        <ContactDetailAvatar contact={contact} />
        <Box lx={{ alignItems: "center", gap: "s4" }}>
          <Text testID="contacts-detail-name" typography="heading3SemiBold" lx={{ color: "base" }}>
            {getDisplayName(contact)}
          </Text>
          <Text testID="contacts-detail-address-count" typography="body2" lx={{ color: "muted" }}>
            {copy.addressCount}
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
        {copy.addAddress}
      </Button>
    </Box>
  );
}
