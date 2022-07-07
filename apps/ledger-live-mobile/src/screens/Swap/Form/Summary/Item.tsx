import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";

interface RowProps {
  title: string;
  children: React.ReactNode;
}

export function Item({ title, children }: RowProps) {
  return (
    <Flex flexDirection="row" justifyContent="space-between" paddingY={4}>
      <Text color="neutral.c70">{title}</Text>
      {children}
    </Flex>
  );
}
