import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { ContactDetailViewProps } from "../types";
import { resolveContactDetailEmptyStateCopy } from "../model/resolveContactDetailEmptyStateCopy";

type ContactDetailEmptyStateProps = Pick<ContactDetailViewProps, "contact" | "labels">;

export function ContactDetailEmptyState({
  contact,
  labels,
}: ContactDetailEmptyStateProps): React.JSX.Element {
  const { title, description } = resolveContactDetailEmptyStateCopy(contact, labels);

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
        {title}
      </Text>
      <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
        {description}
      </Text>
    </Box>
  );
}
