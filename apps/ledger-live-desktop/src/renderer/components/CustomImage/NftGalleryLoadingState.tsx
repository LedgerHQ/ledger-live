import React from "react";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";

const NftGalleryLoadingState = () => {
  return (
    <Flex flexDirection="column" alignItems="center">
      <InfiniteLoader size={50} />
    </Flex>
  );
};

export default NftGalleryLoadingState;
