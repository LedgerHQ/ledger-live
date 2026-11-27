import React, { type ReactNode } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";

const VEIL_OPACITY = 0.6;
const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;

type Props = Readonly<{ isDimmed: boolean; children: ReactNode }>;

// A veil, not an opacity: on Android, an opacity fades each child on its own.
export function Dimmed({ isDimmed, children }: Props) {
  return (
    <Box
      accessibilityElementsHidden={isDimmed}
      importantForAccessibility={isDimmed ? "no-hide-descendants" : "auto"}
    >
      {children}
      {isDimmed ? (
        <Box
          lx={{ backgroundColor: "canvas" }}
          style={[FILL, { opacity: VEIL_OPACITY }]}
          testID="receive-address-dimmed"
        />
      ) : null}
    </Box>
  );
}
