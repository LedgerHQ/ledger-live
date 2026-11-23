import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { StateLayoutProps } from "../types";
import { StateHeader } from "./StateHeader";

/**
 * Layout for a bottom sheet that sizes to its content: a plain stack, because the sheet scrolls.
 * `flex: 1` would give the content a height of 0 there.
 */
export function SheetStateLayout({
  children,
  footer,
  testID,
  ...headerProps
}: Readonly<StateLayoutProps>): React.ReactNode {
  return (
    <Box lx={{ gap: "s24" }} testID={testID}>
      <StateHeader {...headerProps} testID={testID} />
      {children}
      {footer}
    </Box>
  );
}
