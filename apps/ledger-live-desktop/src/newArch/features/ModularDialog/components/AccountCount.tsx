import React from "react";
import { Text } from "@ledgerhq/react-ui/index";

export const accountsCount = ({ label }: { label: string }) => (
  <Text fontSize="12px" fontWeight="500" color="var(--colors-content-subdued-default-default)">
    {label}
  </Text>
);
