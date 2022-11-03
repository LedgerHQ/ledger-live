import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";

const NFTGallerySelector = () => {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Flex flex={1}></Flex>
    </SafeAreaView>
  );
};

export default NFTGallerySelector;
