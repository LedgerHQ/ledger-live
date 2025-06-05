import React from "react";
import { Box, Flex } from "@ledgerhq/react-ui/index";

type Props = {
  children: React.ReactNode;
  customHeight?: string;
};

export const ListWrapper = ({ children, customHeight }: Props) => (
  <Box style={{ height: customHeight ?? "100%", width: "100%", display: "flex" }}>
    <Flex
      style={{
        flex: "1",
        overflow: "hidden",
        height: "100%",
      }}
    >
      {children}
    </Flex>
  </Box>
);
