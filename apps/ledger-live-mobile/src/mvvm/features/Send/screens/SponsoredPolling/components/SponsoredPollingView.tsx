import React from "react";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";

type SponsoredPollingViewProps = Readonly<{
  title: string;
  message: string;
  elapsedLabel: string;
}>;

export function SponsoredPollingView({ title, message, elapsedLabel }: SponsoredPollingViewProps) {
  return (
    <Box
      lx={{
        flex: 1,
        backgroundColor: "canvas",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: "s16",
        gap: "s16",
      }}
      testID="send-sponsored-polling"
    >
      <Spinner size={32} color="base" />
      <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {title}
      </Text>
      <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
        {message}
      </Text>
      <Text typography="body3" lx={{ color: "muted", textAlign: "center" }}>
        {elapsedLabel}
      </Text>
    </Box>
  );
}
