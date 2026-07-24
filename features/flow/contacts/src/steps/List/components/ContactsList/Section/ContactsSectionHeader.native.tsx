import React from "react";
import { Box, SectionHeader, SectionHeaderTitle } from "@ledgerhq/lumen-ui-rnative";

type ContactsSectionHeaderProps = Readonly<{
  title: string;
}>;

export function ContactsSectionHeader({ title }: ContactsSectionHeaderProps): React.JSX.Element {
  return (
    <Box
      testID={`contacts-section-${title}-background`}
      lx={{ width: "full", marginTop: "s8", backgroundColor: "base" }}
    >
      <SectionHeader appearance="plain" testID={`contacts-section-${title}`} lx={{ width: "full" }}>
        <SectionHeaderTitle>{title}</SectionHeaderTitle>
      </SectionHeader>
    </Box>
  );
}
