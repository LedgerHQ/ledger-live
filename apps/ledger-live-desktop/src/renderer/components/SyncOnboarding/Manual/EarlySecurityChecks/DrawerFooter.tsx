import { Divider, Flex } from "@ledgerhq/react-ui";
import React from "react";

type Props = {
  children?: React.ReactNode | null;
};

const DrawerFooter: React.FC<Props> = ({ children }) => (
  <Flex flexDirection="column" alignSelf="stretch">
    <Divider />
    <Flex
      px={12}
      alignSelf="stretch"
      flexDirection="row"
      justifyContent="space-between"
      pt={4}
      pb={1}
    >
      <Flex flex={1} />
      {children}
    </Flex>
  </Flex>
);

export default DrawerFooter;
