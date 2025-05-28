import React from "react";
import { Box, Flex } from "@ledgerhq/react-ui/index";

type Props = {
  children: React.ReactNode;
};

export const ListWrapper = ({ children }: Props) => (
  <Box style={{ height: "100%", width: "100%", display: "flex" }}>
    <Flex
      style={{
        flex: "1",
        overflow: "hidden",
        maxHeight: "100%",
      }}
    >
      {children}
    </Flex>
  </Box>
);
