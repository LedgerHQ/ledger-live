import React, { type ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, LinearGradient } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

/**
 * Approximate footer height, excluding the safe-area inset. Reserve
 * `BOTTOM_GRADIENT_FOOTER_HEIGHT + safeArea.bottom` as `paddingBottom` on the
 * scrollable content so the last rows clear the footer.
 */
export const BOTTOM_GRADIENT_FOOTER_HEIGHT = 80;

type Props = Readonly<{
  children: ReactNode;
  /** Extra layout for the inner content row, e.g. `{ alignItems: "center" }`. */
  contentStyle?: LumenViewStyle;
  testID?: string;
}>;

/**
 * Floating bottom bar that fades the scroll content behind it into the screen
 * background, keeping its CTA(s) visible. Render it as the last sibling of a
 * `flex: 1` screen and reserve bottom padding on the scrollable content with
 * {@link BOTTOM_GRADIENT_FOOTER_HEIGHT}.
 */
export function BottomGradientFooter({ children, contentStyle, testID }: Props) {
  const { bottom } = useSafeAreaInsets();

  return (
    <LinearGradient
      stops={[
        { color: "base", opacity: 0 },
        { offset: 1, color: "base", opacity: 1 },
      ]}
      direction="to-bottom"
      testID={testID}
      lx={containerStyle}
    >
      <Box lx={{ ...rowStyle, ...contentStyle }} style={{ paddingBottom: bottom + 16 }}>
        {children}
      </Box>
    </LinearGradient>
  );
}

const containerStyle: LumenViewStyle = {
  position: "absolute",
  bottom: "s0",
  left: "s0",
  right: "s0",
};

const rowStyle: LumenViewStyle = {
  paddingHorizontal: "s16",
  paddingTop: "s16",
};
