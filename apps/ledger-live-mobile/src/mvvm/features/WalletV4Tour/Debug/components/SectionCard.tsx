import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
}

export const SectionCard = ({ children, title }: SectionCardProps) => (
  <Box
    lx={{
      padding: "s20",
      backgroundColor: "surface",
      borderRadius: "md",
      marginBottom: "s16",
    }}
  >
    {title && (
      <Text typography="heading5SemiBold" lx={{ color: "base", marginBottom: "s16" }}>
        {title}
      </Text>
    )}
    {children}
  </Box>
);
