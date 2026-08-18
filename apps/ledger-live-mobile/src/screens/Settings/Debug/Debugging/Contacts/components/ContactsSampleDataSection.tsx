import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsSampleDataSectionProps } from "../types";
import { SectionHeader } from "./SectionHeader";

export function ContactsSampleDataSection({
  onLoadSamples,
  onClearContacts,
}: ContactsSampleDataSectionProps): React.JSX.Element {
  return (
    <>
      <SectionHeader title="CONTACTS DATA" />
      <Box
        lx={{
          backgroundColor: "surface",
          borderRadius: "md",
          padding: "s16",
          marginBottom: "s24",
        }}
      >
        <Text typography="body3" lx={{ color: "muted", marginBottom: "s16" }}>
          Replace saved contacts with 25 sample contacts for list and section index testing.
        </Text>
        <Button appearance="accent" size="sm" onPress={onLoadSamples} lx={{ marginBottom: "s12" }}>
          Load 25 sample contacts
        </Button>
        <Button appearance="base" size="sm" onPress={onClearContacts}>
          Clear saved contacts
        </Button>
      </Box>
    </>
  );
}
