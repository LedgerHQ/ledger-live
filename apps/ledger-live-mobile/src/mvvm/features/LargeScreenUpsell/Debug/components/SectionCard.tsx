import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const SectionCard = ({ children, title, subtitle }: SectionCardProps) => (
  <Box
    lx={{
      padding: "s20",
      backgroundColor: "surface",
      borderRadius: "md",
      marginBottom: "s16",
    }}
  >
    {title && (
      <Text
        typography="heading5SemiBold"
        lx={{ color: "base", marginBottom: subtitle ? "s4" : "s16" }}
      >
        {title}
      </Text>
    )}
    {subtitle && (
      <Text typography="body3" lx={{ color: "muted", marginBottom: "s16" }}>
        {subtitle}
      </Text>
    )}
    {children}
  </Box>
);
