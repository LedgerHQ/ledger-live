import { Flex } from "@ledgerhq/native-ui";
import React from "react";
import { Skeleton } from "./Skeleton";

interface Props {
  nbItems?: number;
}
const SkeletonList = ({ nbItems }: Props) => (
  <Flex flexDirection="column" flex={1} overflow="hidden" rowGap="8px">
    {Array.from({ length: nbItems ?? 10 }, (_, index) => (
      <Skeleton key={index} barHeight={64} minHeight={64} />
    ))}
  </Flex>
);

export default SkeletonList;
