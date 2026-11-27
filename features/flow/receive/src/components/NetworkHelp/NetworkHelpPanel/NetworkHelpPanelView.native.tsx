import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { Trans } from "@shared/i18n";
import type { NetworkHelpPanelViewProps } from "./NetworkHelpPanelView.types";

export function NetworkHelpPanelView({ choose, testAmount, onOpenFaq }: NetworkHelpPanelViewProps) {
  return (
    <Box lx={{ gap: "s24" }} testID="receive-network-help">
      <Text typography="body1" lx={{ color: "base" }}>
        {choose}
      </Text>
      <Text typography="body1" lx={{ color: "base" }}>
        {testAmount}
      </Text>
      <Text typography="body1" lx={{ color: "base" }}>
        <Trans
          i18nKey="receiveAddress.networkHelp.faq"
          components={[
            <Text
              key="faq"
              typography="body1"
              lx={{ color: "interactive" }}
              accessibilityRole="link"
              onPress={onOpenFaq}
            />,
          ]}
        />
      </Text>
    </Box>
  );
}
