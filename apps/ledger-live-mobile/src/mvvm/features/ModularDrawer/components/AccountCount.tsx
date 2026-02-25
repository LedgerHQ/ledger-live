import React from "react";
import { Text } from "@ledgerhq/native-ui/index";

export const accountsCount = ({ label }: { label: string }) => (
  <Text variant="body" fontSize="12px" color="neutral.c80">
    {label}
  </Text>
);
