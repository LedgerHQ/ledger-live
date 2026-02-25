import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import SkeletonTile from "../SkeletonTile";

const SKELETON_COUNT = 8;

export const SkeletonState = () => {
  const styles = useStyleSheet(
    lumenTheme => ({
      container: {
        flexDirection: "row" as const,
        marginLeft: lumenTheme.spacings["-s8"],
      },
    }),
    [],
  );

  return (
    <Box style={styles.container} testID="market-banner-skeleton">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <SkeletonTile index={i} key={i} />
      ))}
    </Box>
  );
};
