import React from "react";
import { SectionHeader, SectionHeaderTitle } from "@ledgerhq/lumen-ui-rnative";

type ContactsSectionHeaderProps = Readonly<{
  title: string;
}>;

export function ContactsSectionHeader({ title }: ContactsSectionHeaderProps): React.JSX.Element {
  return (
    <SectionHeader
      appearance="plain"
      testID={`contacts-section-${title}`}
      lx={{ width: "full", marginTop: "s8" }}
    >
      <SectionHeaderTitle>{title}</SectionHeaderTitle>
    </SectionHeader>
  );
}
