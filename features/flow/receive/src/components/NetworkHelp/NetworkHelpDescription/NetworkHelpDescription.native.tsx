import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { Trans } from "@shared/i18n";
import type { NetworkHelpDescriptionProps } from "./NetworkHelpDescription.types";

/** Under "Select network" of the receive flow: which network to pick, with a link to the help. */
export function NetworkHelpDescription({ assetTicker, onLearnMore }: NetworkHelpDescriptionProps) {
  return (
    <Text typography="body2" lx={{ color: "muted" }} testID="receive-network-help-description">
      <Trans
        i18nKey="receiveAddress.networkHelp.description"
        values={{ asset: assetTicker }}
        components={[
          <Text
            key="learn-more"
            typography="body2"
            lx={{ color: "interactive" }}
            accessibilityRole="link"
            onPress={onLearnMore}
          />,
        ]}
      />
    </Text>
  );
}
