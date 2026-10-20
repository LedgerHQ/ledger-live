import React from "react";
import { ScrollView } from "react-native";
import { Banner, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { Check } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { AdvancedLogsContentViewProps } from "./types";

export function AdvancedLogsContentView({
  derivationTip,
  synchronised,
  json,
  copyLabel,
  isCopied,
  onCopy,
}: AdvancedLogsContentViewProps) {
  return (
    <Box lx={{ flex: 1 }} testID="account-settings-advanced-logs-content">
      <ScrollView style={{ flex: 1 }} alwaysBounceVertical={false}>
        <Box lx={{ gap: "s24", paddingBottom: "s24" }}>
          {derivationTip ? <Banner appearance="info" description={derivationTip} /> : null}
          <Box lx={{ gap: "s16" }}>
            <Text typography="body1" lx={{ color: "base" }}>
              {synchronised}
            </Text>
            <Text
              typography="body1"
              lx={{ color: "muted" }}
              testID="account-settings-advanced-logs-json"
            >
              {json}
            </Text>
          </Box>
        </Box>
      </ScrollView>
      <Button
        appearance="base"
        size="lg"
        isFull
        icon={isCopied ? Check : undefined}
        onPress={onCopy}
        testID="account-settings-copy-logs"
      >
        {copyLabel}
      </Button>
    </Box>
  );
}
