import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { CONTENT_AREA_HEIGHT } from "./constants";

interface ScreenHeroSectionViewProps {
  readonly children: React.ReactNode;
  readonly ctas?: React.ReactNode;
  readonly testID?: string;
  readonly minContentHeight?: number;
}

const contentAreaStyle: LumenViewStyle = {
  justifyContent: "center",
  alignItems: "center",
  paddingBottom: "s8",
};

const ctasStyle: LumenViewStyle = {
  paddingHorizontal: "s16",
};

export const ScreenHeroSectionView = ({
  children,
  ctas,
  testID,
  minContentHeight,
}: ScreenHeroSectionViewProps) => (
  <Box lx={{ gap: "s12" }} testID={testID}>
    <Box lx={contentAreaStyle} style={{ minHeight: minContentHeight ?? CONTENT_AREA_HEIGHT }}>
      {children}
    </Box>
    {ctas && <Box lx={ctasStyle}>{ctas}</Box>}
  </Box>
);
