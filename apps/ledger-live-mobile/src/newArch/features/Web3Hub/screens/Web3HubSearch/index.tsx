import { Text } from "@ledgerhq/native-ui";
import React from "react";
import SafeAreaView from "~/components/SafeAreaView";

export default function Web3HubSearch() {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      isFlex
      style={{
        flexDirection: "column",
        gap: 26,
        marginHorizontal: 24,
        marginTop: 114,
      }}
    >
      <Text>Search</Text>
    </SafeAreaView>
  );
}
