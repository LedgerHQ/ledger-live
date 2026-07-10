import React from "react";
import { Box, Text, Button } from "@ledgerhq/lumen-ui-rnative";
import { ContactsDevToolHeaderProps } from "../types";

export const ContactsDevToolHeader = ({ onRestoreDefaults }: ContactsDevToolHeaderProps) => (
  <Box lx={{ marginBottom: "s24" }}>
    <Text typography="body2" lx={{ color: "muted", marginBottom: "s16" }}>
      Toggle the Contacts rollout flag and its parameters for development and QA.
    </Text>
    <Button
      appearance="accent"
      size="sm"
      onPress={onRestoreDefaults}
      testID="debug-contacts-restore-defaults"
    >
      Restore defaults
    </Button>
  </Box>
);
