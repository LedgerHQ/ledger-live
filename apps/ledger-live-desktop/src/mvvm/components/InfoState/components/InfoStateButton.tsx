import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { InfoStateCta } from "../types";

export function InfoStateButton({
  cta,
  appearance,
}: Readonly<{
  cta: InfoStateCta;
  appearance: "base" | "gray";
}>) {
  return (
    <Button
      appearance={appearance}
      size="lg"
      isFull
      onClick={cta.onPress}
      disabled={cta.disabled}
      data-testid={cta.testID}
    >
      {cta.label}
    </Button>
  );
}
