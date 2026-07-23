import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { ContactDetailPageProps } from "../../types";
import { ContactDetailEmptyState } from "./ContactDetailEmptyState.native";
import { ContactDetailHeader } from "./ContactDetailHeader.native";

export function ContactDetailPage({
  contact,
  labels,
  meAvatarSrc,
  onAddAddress,
}: ContactDetailPageProps): React.JSX.Element {
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
