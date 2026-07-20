import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsListItem } from "../..";
import { getContactInitialAvatarBackground } from "../../internals";

type ContactsInitialAvatarProps = Readonly<{
  contact: ContactsListItem;
}>;

export function ContactsInitialAvatar({ contact }: ContactsInitialAvatarProps): React.JSX.Element {
  return (
    <Box
      testID={`contacts-initial-avatar-${contact.contactId}`}
      lx={{
        width: "s40",
        height: "s40",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "full",
        backgroundColor: getContactInitialAvatarBackground(contact.contactId),
      }}
    >
      <Text typography="body2SemiBold" lx={{ color: "black" }}>
        {contact.initial}
      </Text>
    </Box>
  );
}
