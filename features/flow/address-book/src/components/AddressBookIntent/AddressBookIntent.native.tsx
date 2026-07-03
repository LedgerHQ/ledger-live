import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { AddressBookIntentComponentProps } from "./types";
import { formatAddressBookIntentState, getAddressBookIntentTitle } from "./formatJobState";

export function AddressBookIntentComponent({ jobState }: AddressBookIntentComponentProps) {
  return (
    <Box lx={{ gap: "s12", padding: "s16" }}>
      <Text typography="body1SemiBold">{getAddressBookIntentTitle(jobState)}</Text>
      <Text typography="body3">{formatAddressBookIntentState(jobState)}</Text>
    </Box>
  );
}
