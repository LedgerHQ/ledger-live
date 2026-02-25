import { Flex } from "@ledgerhq/react-ui/index";
import Skeleton from "LLD/components/Skeleton";
import React from "react";

const SkeletonList = () => (
  <Flex flexDirection="column" flex="1 1 auto" overflow="hidden" rowGap="8px">
    {Array.from({ length: 10 }, (_, index) => (
      <Skeleton key={index} barHeight={64} minHeight={64} />
    ))}
  </Flex>
);

export default SkeletonList;
