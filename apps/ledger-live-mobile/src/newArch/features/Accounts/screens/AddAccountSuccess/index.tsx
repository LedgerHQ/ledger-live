import React from "react";
import { Text } from "@ledgerhq/native-ui";
import SafeAreaView from "~/components/SafeAreaView";

export default function AddAccountsSuccess() {
  return (
    <SafeAreaView edges={["left", "right"]} isFlex testID="select-crypto-view-area">
      <Text>
        {"Account added successfully! TODO in https://ledgerhq.atlassian.net/browse/LIVE-13983"}
      </Text>
    </SafeAreaView>
  );
}
