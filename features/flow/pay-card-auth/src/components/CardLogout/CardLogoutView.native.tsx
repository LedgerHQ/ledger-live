import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { CardLogoutViewProps } from "./types";

export function CardLogoutView({
  title,
  idLabel,
  userId,
  verificationLabel,
  verificationValue,
  logoutLabel,
  isLoading,
  onLogoutPress,
}: CardLogoutViewProps) {
  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        gap: "s16",
        paddingTop: "s16",
      }}
    >
      <Box lx={{ flex: 1, flexDirection: "column", gap: "s4" }} style={{ minWidth: 0 }}>
        <Text typography="heading5SemiBold" lx={{ color: "base" }}>
          {title}
        </Text>
        <Text typography="body3" lx={{ color: "muted" }}>
          {idLabel}: {userId}
        </Text>
        <Text typography="body3" lx={{ color: "muted" }}>
          {verificationLabel}: {verificationValue}
        </Text>
      </Box>
      <Button
        appearance="gray"
        size="md"
        loading={isLoading}
        disabled={isLoading}
        onPress={onLogoutPress}
        accessibilityLabel={logoutLabel}
      >
        {logoutLabel}
      </Button>
    </Box>
  );
}
