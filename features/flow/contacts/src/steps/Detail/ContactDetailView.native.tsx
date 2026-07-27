import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { ContactDetailViewProps } from "./types";
import { ContactDetailEmptyState } from "./components/ContactDetailEmptyState.native";
import { ContactDetailHeader } from "./components/ContactDetailHeader.native";

export function ContactDetailView({
  contact,
  labels,
  meAvatarSrc,
  onAddAddress,
}: ContactDetailViewProps): React.JSX.Element {
  return (
    <Box testID="contacts-detail-screen" lx={{ flex: 1, backgroundColor: "base" }}>
      <ContactDetailHeader
        contact={contact}
        labels={labels}
        meAvatarSrc={meAvatarSrc}
        onAddAddress={onAddAddress}
      />
      <ContactDetailEmptyState contact={contact} labels={labels} />
    </Box>
  );
}
