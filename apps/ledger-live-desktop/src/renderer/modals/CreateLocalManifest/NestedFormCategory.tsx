import { Flex } from "@ledgerhq/react-ui";
import React, { ReactNode } from "react";
import { useTheme } from "styled-components";

const NestedFormCategory = ({ children }: { children: ReactNode }) => {
  const { colors } = useTheme();

  return (
    <Flex
      borderLeft={`inset ${colors.opacityDefault.c20} 3px`}
      height={"fit-content"}
      flexDirection={"column"}
      width={"100%"}
      rowGap={2}
      paddingLeft={3}
      paddingTop={2}
      marginBottom={2}
    >
      {children}
    </Flex>
  );
};

export default NestedFormCategory;
