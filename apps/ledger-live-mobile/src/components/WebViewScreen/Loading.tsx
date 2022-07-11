import React from "react";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";

const WebViewLoading = () => (
  <Flex height="100%" alignItems="center" justifyContent="center">
    <InfiniteLoader />
  </Flex>
);

export default WebViewLoading;
