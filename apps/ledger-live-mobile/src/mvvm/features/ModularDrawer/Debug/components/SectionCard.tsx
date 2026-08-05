import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
}

export const SectionCard = ({ children, title }: SectionCardProps) => (
  <Box lx={{ padding: "s14", backgroundColor: "surface", borderRadius: "lg", marginBottom: "s12" }}>
    {title && (
      <Text typography="heading4SemiBold" lx={{ color: "base", marginBottom: "s12" }}>
        {title}
      </Text>
    )}
    {children}
  </Box>
);
