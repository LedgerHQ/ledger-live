import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import SafeAreaView from "~/components/SafeAreaView";

type AgentIntentPlaceholderViewProps = Readonly<{
  title: string;
}>;

export function AgentIntentPlaceholderView({ title }: AgentIntentPlaceholderViewProps) {
  return (
    <SafeAreaView isFlex testID="agent-intent-placeholder">
      <Box lx={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text typography="heading4SemiBold" lx={{ color: "base" }}>
          {title}
        </Text>
      </Box>
    </SafeAreaView>
  );
}
