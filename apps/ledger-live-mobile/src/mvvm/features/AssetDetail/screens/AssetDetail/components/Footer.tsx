import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { ASSET_DETAIL_TEST_IDS } from "../../../testIds";
import { PLACEHOLDER_COLORS } from "../utils/constants";
import { SectionPlaceholder } from "./SectionPlaceholder";

export function Footer() {
  const { bottom } = useSafeAreaInsets();

  return (
    <Box
      testID={ASSET_DETAIL_TEST_IDS.ctas}
      lx={containerStyle}
      style={{ paddingBottom: bottom + 16 }}
    >
      <SectionPlaceholder
        testID={`${ASSET_DETAIL_TEST_IDS.ctas}-content`}
        backgroundColor={PLACEHOLDER_COLORS.ctas}
        height={48}
      />
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  position: "absolute",
  bottom: "s0",
  left: "s0",
  right: "s0",
  paddingHorizontal: "s16",
  paddingTop: "s16",
};
