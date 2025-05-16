import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import React from "react";

export const LoadingIndicator = ({ height }: { height: number }) => (
  <Flex height={height} width="100%" justifyContent="center" alignItems="center">
    <InfiniteLoader color="primary.c50" size={38} />
  </Flex>
);
