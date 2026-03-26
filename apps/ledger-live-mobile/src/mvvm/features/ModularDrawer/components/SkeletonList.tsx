import React from "react";
import { Skeleton, Box } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

interface Props {
  nbItems?: number;
}
const SkeletonList = ({ nbItems }: Props) => (
  <Box lx={ContainerStyle}>
    {Array.from({ length: nbItems ?? 10 }, (_, index) => (
      <Skeleton component="list-item" key={index} />
    ))}
  </Box>
);

export default SkeletonList;

const ContainerStyle: LumenViewStyle = {
  flexDirection: "column",
  flex: 1,
  overflow: "hidden",
  rowGap: "s8",
  marginHorizontal: "s16",
};
