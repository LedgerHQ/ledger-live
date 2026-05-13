import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
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
      lx={{ width: "full" }}
      onPress={cta.onPress}
      disabled={cta.disabled}
      testID={cta.testID}
    >
      {cta.label}
    </Button>
  );
}
