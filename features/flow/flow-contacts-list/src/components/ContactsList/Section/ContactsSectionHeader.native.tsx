import React from "react";
import { Box, SectionHeader, SectionHeaderTitle } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsListSurface } from "../../../types";

type ContactsSectionHeaderProps = Readonly<{
  title: string;
  surface: ContactsListSurface;
}>;

export function ContactsSectionHeader({
  title,
  surface,
}: ContactsSectionHeaderProps): React.JSX.Element {
  return (
    <Box
      testID={`contacts-section-${title}-background`}
      lx={{ width: "full", marginTop: "s8", backgroundColor: surface }}
    >
      <SectionHeader appearance="plain" testID={`contacts-section-${title}`} lx={{ width: "full" }}>
        <SectionHeaderTitle>{title}</SectionHeaderTitle>
      </SectionHeader>
    </Box>
  );
}
