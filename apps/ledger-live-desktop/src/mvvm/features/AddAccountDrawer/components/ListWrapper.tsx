import { Box, Flex } from "@ledgerhq/react-ui/index";
import React from "react";

type Props = {
  children: React.ReactNode;
  customHeight?: string;
  testID?: string;
};

const TITLE_HEIGHT = 52;
const ROW_MARGIN = 8;
const MARGIN_BOTTOM = TITLE_HEIGHT + ROW_MARGIN;
const LIST_HEIGHT = `calc(100% - ${MARGIN_BOTTOM}px)`;

export const ListWrapper = ({ children, customHeight, ...rest }: Props) => (
  <Box style={{ height: customHeight ?? LIST_HEIGHT, width: "100%", display: "flex" }} {...rest}>
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
