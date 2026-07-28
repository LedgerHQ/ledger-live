import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { CardLoginViewProps } from "./types";

export function CardLoginView({
  loginLabel,
  isLoading,
  errorMessage,
  onLoginPress,
}: CardLoginViewProps) {
  return (
    <Box lx={{ flexDirection: "column", alignItems: "flex-end", gap: "s4" }}>
      <Button
        appearance="base"
        size="md"
        loading={isLoading}
        disabled={isLoading}
        onPress={onLoginPress}
        accessibilityLabel={loginLabel}
      >
        {loginLabel}
      </Button>
      {errorMessage ? (
        <Text typography="body3" lx={{ color: "error" }}>
          {errorMessage}
        </Text>
      ) : null}
    </Box>
  );
}
