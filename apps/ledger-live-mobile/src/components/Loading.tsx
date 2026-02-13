import React from "react";

import { Box, InfiniteLoader } from "@ledgerhq/native-ui";
import { Flex } from "@ledgerhq/native-ui";

type Props = {
  size?: number;
  color?: string;
  backgroundColor?: string;
};

export const Loading = ({ size = 40, color, backgroundColor = "background.main" }: Props) => (
  <Flex
    flex={1}
    position="absolute"
    top="0"
    right="0"
    bottom="0"
    left="0"
    backgroundColor={backgroundColor}
  >
    <Box flex={1} justifyContent="center">
      <InfiniteLoader size={size} color={color} />
    </Box>
  </Flex>
);
