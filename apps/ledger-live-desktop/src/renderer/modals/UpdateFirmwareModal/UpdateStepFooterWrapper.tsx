import React from "react";
import { Flex, Divider } from "@ledgerhq/react-ui";

export const UpdateStepFooterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Flex flexDirection="column" alignSelf="stretch">
      <Divider color={"neutral.c30"} />
      <Flex
        flex={1}
        px={12}
        alignSelf="stretch"
        flexDirection="row"
        justifyContent="space-between"
        pt={6}
        pb={1}
      >
        {children}
      </Flex>
    </Flex>
  );
};
