import React from "react";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";

interface ListFooterProps {
  isLoading: boolean;
}

function ListFooter({ isLoading }: ListFooterProps) {
  return (
    <Flex height={40} mb={6}>
      {isLoading ? <InfiniteLoader size={30} /> : null}
    </Flex>
  );
}

export default ListFooter;
