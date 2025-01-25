import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import React from "react";

const Loader: React.FC = () => {
  return (
    <Flex justifyContent="center" my={4}>
      <InfiniteLoader />
    </Flex>
  );
};

export default Loader;
