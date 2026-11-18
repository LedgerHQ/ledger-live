import React, { type ReactNode } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";

// The content shows through at 40%, as at an opacity of 0.4.
const VEIL_OPACITY = 0.6;
const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;

type Props = Readonly<{ isDimmed: boolean; children: ReactNode }>;

/**
 * Steps a section back behind a veil of the screen's color, which also takes its touches. A veil
 * dims native views evenly, where an opacity on the section would fade each child on its own.
 */
export function Dimmed({ isDimmed, children }: Props) {
  return (
    <Box>
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
