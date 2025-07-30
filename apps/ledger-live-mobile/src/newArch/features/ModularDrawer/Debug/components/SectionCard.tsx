import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
}

export const SectionCard = ({ children, title }: SectionCardProps) => (
  <Flex p={5} backgroundColor="neutral.c40" borderRadius={12} mb={4}>
    {title && (
      <Text variant="h3Inter" color="neutral.c100" fontWeight="semiBold" mb={4}>
        {title}
      </Text>
    )}
    {children}
  </Flex>
);
