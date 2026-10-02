import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";

type PayDisclaimerProps = {
  readonly text: string;
};

export function PayDisclaimer({ text }: PayDisclaimerProps) {
  return (
    <Text
      typography="body3"
      lx={{ color: "muted", textAlign: "center", marginTop: "s16" }}
      testID="pay-disclaimer"
    >
      {text}
    </Text>
  );
}
