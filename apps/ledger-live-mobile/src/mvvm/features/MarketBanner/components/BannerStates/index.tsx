import React from "react";
import SkeletonTile from "../SkeletonTile";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { Box } from "@ledgerhq/lumen-ui-rnative";

type BannerStatesProps = {
  isError: boolean;
};

export const BannerStates = ({ isError }: BannerStatesProps) => {
  const styles = useStyleSheet(
    theme => ({
      container: {
        flexDirection: "row",
        marginLeft: theme.spacings.s8 * -1,
      },
    }),
    [],
  );

  // will be done in next task (Error handling)
  if (isError) {
    return <Box />;
  }

  return (
    <Box style={styles.container}>
      {Array.from({ length: 8 }, (_, i) => (
        <SkeletonTile index={i} key={i} />
      ))}
    </Box>
  );
};
