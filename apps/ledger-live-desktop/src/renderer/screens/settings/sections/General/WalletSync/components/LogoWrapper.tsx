import { Box, Flex } from "@ledgerhq/react-ui";
import React, { PropsWithChildren } from "react";

export const LogoWrapper = ({
  children,
  opacity = "70%",
}: PropsWithChildren & { opacity?: string }) => (
  <Box>
    <Flex padding="7px" borderRadius="13px" border="1px solid hsla(0, 0%, 100%, 0.05)">
      <Flex
        borderRadius="9px"
        backgroundColor="hsla(248, 100%, 85%, 0.08)"
        padding="5px"
        opacity={opacity}
      >
        {children}
      </Flex>
    </Flex>
  </Box>
);
