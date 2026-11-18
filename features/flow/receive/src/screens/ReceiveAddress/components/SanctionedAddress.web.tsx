import React from "react";
import { ExternalLink } from "@ledgerhq/lumen-ui-react/symbols";
import { InfoState } from "@shared/ui-info-state";
import type { SanctionedAddressProps } from "./SanctionedAddress.types";

export function SanctionedAddress({ sanctioned }: SanctionedAddressProps) {
  return (
    <InfoState
      preset="error"
      size="hug"
      title={sanctioned.title}
      description={sanctioned.description}
      primaryCta={{
        label: sanctioned.closeLabel,
        onPress: sanctioned.onClose,
        testID: "receive-address-sanctioned-close",
      }}
      secondaryCta={
        sanctioned.learnMore && {
          label: sanctioned.learnMore.label,
          icon: ExternalLink,
          onPress: sanctioned.learnMore.onPress,
        }
      }
      testID="receive-address-sanctioned"
    />
  );
}
