import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { ContactDetailViewProps } from "../types";

type ContactDetailEmptyStateProps = Pick<ContactDetailViewProps, "contact" | "labels">;

export function ContactDetailEmptyState({
  contact,
  labels,
}: ContactDetailEmptyStateProps): React.JSX.Element {
  const description = contact.isMe
    ? labels.emptyMeDescription
    : labels.formatEmptyContactDescription(contact.name);

  return (
    <Box
      testID="contacts-detail-empty-state"
      lx={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: "s4",
        paddingHorizontal: "s24",
      }}
    >
      <Text typography="body1SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {labels.emptyStateTitle}
      </Text>
      <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
        {description}
      </Text>
    </Box>
  );
}
