import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

interface ScreenHeroSectionViewProps {
  readonly children: React.ReactNode;
  readonly ctas?: React.ReactNode;
  readonly testID?: string;
}

const CONTENT_AREA_HEIGHT = 208;

const contentAreaStyle: LumenViewStyle = {
  justifyContent: "center",
  alignItems: "center",
  paddingBottom: "s8",
};

const ctasStyle: LumenViewStyle = {
  paddingHorizontal: "s16",
};

export const ScreenHeroSectionView = ({ children, ctas, testID }: ScreenHeroSectionViewProps) => (
  <Box lx={{ gap: "s12" }} testID={testID}>
    <Box lx={contentAreaStyle} style={{ minHeight: CONTENT_AREA_HEIGHT }}>
      {children}
    </Box>
    {ctas && <Box lx={ctasStyle}>{ctas}</Box>}
  </Box>
);
