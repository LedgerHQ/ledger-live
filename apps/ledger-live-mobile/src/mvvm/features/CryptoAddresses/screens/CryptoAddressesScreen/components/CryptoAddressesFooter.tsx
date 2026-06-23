import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import {
  BottomGradientFooter,
  BOTTOM_GRADIENT_FOOTER_HEIGHT,
} from "LLM/components/BottomGradientFooter";

type Props = Readonly<{
  label: string;
  onPress: () => void;
}>;

export const FOOTER_HEIGHT = BOTTOM_GRADIENT_FOOTER_HEIGHT;

export default function CryptoAddressesFooter({ label, onPress }: Props) {
  return (
    <BottomGradientFooter contentStyle={{ alignItems: "center" }}>
      <Button
        appearance="base"
        size="lg"
        icon={Plus}
        onPress={onPress}
        testID="crypto-addresses-add-button"
      >
        {label}
      </Button>
    </BottomGradientFooter>
  );
}
