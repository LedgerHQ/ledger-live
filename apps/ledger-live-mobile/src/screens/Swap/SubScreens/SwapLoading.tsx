import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex } from "@ledgerhq/native-ui";
import { Loading } from "../Loading";

export default function SwapLoading() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Flex flex={1} justifyContent="center" alignItems="center" px={6}>
        <Loading size={60} />
      </Flex>
    </SafeAreaView>
  );
}
