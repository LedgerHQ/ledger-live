import React from "react";
import Config from "react-native-config";
import { Skeleton, Box } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

interface Props {
  nbItems?: number;
}

// Skeleton's infinite pulse animation keeps Detox from reaching idle on iOS; skip it under Detox.
const SkeletonList = ({ nbItems }: Props) => {
  if (Config.DETOX) return null;

  return (
    <Box lx={ContainerStyle}>
      {Array.from({ length: nbItems ?? 10 }, (_, index) => (
        <Skeleton component="list-item" key={index} />
      ))}
    </Box>
  );
};

export default SkeletonList;

const ContainerStyle: LumenViewStyle = {
  flexDirection: "column",
  flex: 1,
  overflow: "hidden",
  rowGap: "s8",
  marginHorizontal: "s16",
};
