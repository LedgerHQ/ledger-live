import React from "react";
import { Box, Text, Switch } from "@ledgerhq/lumen-ui-rnative";
import { ContactsEnabledToggleProps } from "../types";

export const ContactsEnabledToggle = ({ isEnabled, onToggle }: ContactsEnabledToggleProps) => (
  <Box lx={{ marginBottom: "s24" }}>
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: "s16",
        paddingHorizontal: "s16",
        backgroundColor: isEnabled ? "surfaceHover" : "surface",
        borderRadius: "md",
      }}
    >
      <Text lx={{ color: "base" }} typography="heading5SemiBold">
        Contacts enabled
      </Text>
      <Switch
        testID="debug-contacts-enabled-switch"
        checked={isEnabled}
        onCheckedChange={onToggle}
      />
    </Box>
  </Box>
);
