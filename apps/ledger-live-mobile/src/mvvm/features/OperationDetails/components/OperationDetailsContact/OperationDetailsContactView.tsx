import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { ContactAvatar } from "@features/platform-contacts";
import type { OperationDetailsContact } from "./useOperationDetailsContactViewModel";

type OperationDetailsContactViewProps = Readonly<{
  contact: OperationDetailsContact;
}>;

export function OperationDetailsContactView({ contact }: OperationDetailsContactViewProps) {
  return (
    <Box
      lx={{ flexDirection: "row", alignItems: "center", gap: "s8", marginBottom: "s4" }}
      testID="operation-details-contact"
    >
      <Text typography="body3SemiBold" lx={{ color: "base", flexShrink: 1 }} numberOfLines={1}>
        {contact.name}
      </Text>
      <ContactAvatar
        contactId={contact.contactId}
        name={contact.rawName}
        isMe={contact.isMe}
        size="xs"
      />
    </Box>
  );
}
