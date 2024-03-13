import React from "react";
import { Flex } from "@ledgerhq/react-ui";

type Props = { children: React.ReactNode };

const Container = ({ children }: Props) => {
  return (
    <Flex p={6} mb={40} bg="palette.background.paper" borderRadius={6}>
      {children}
    </Flex>
  );
};

export default Container;
