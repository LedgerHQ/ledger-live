import { Flex, Icons, Text } from "@ledgerhq/react-ui/index";
import React from "react";

export type Props = {
  text: string;
  description?: string;
  variant: "error" | "success";
};

export function Result({ text, variant, description }: Props) {
  const Icon = variant === "error" ? Icons.DeleteCircleFill : Icons.CheckmarkCircleFill;
  const color = variant === "error" ? "error.c70" : "success.c70";
  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      flex={1}
      rowGap={"16px"}
    >
      <Icon color={color} size="L" />
      <Text variant="bodyLineHeight" fontWeight="semiBold" textAlign="center">
        {text}
      </Text>

      {description && (
        <Text variant="paragraphLineHeight" textAlign="center" color="neutral.c70">
          {description}
        </Text>
      )}
    </Flex>
  );
}
