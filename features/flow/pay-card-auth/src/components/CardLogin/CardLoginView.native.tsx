import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { CardLoginIntroView } from "./CardLoginIntroView";
import type { CardLoginViewProps } from "./types";

export function CardLoginView({
  title,
  description,
  loginLabel,
  isLoading,
  errorMessage,
  onLoginPress,
  intro,
}: CardLoginViewProps) {
  return (
    <>
      <Box
        lx={{
          flexDirection: "column",
          gap: "s4",
          paddingTop: "s16",
        }}
      >
        <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s16" }}>
          <Box lx={{ flex: 1, flexDirection: "column", gap: "s4" }} style={{ minWidth: 0 }}>
            <Text typography="heading5SemiBold" lx={{ color: "base" }}>
              {title}
            </Text>
            <Text typography="body2" lx={{ color: "muted" }}>
              {description}
            </Text>
          </Box>
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
        </Box>
        {errorMessage ? (
          <Text typography="body3" lx={{ color: "error", alignSelf: "flex-end" }}>
            {errorMessage}
          </Text>
        ) : null}
      </Box>
      <CardLoginIntroView {...intro} />
    </>
  );
}
