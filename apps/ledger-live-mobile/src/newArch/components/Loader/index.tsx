import React from "react";
import { InfiniteLoader } from "@ledgerhq/native-ui";
import SafeAreaViewFixed from "~/components/SafeAreaView";

export const Loader = () => {
  return (
    <SafeAreaViewFixed isFlex style={{ justifyContent: "center", alignItems: "center" }}>
      <InfiniteLoader />
    </SafeAreaViewFixed>
  );
};
