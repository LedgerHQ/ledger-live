import React from "react";
import { View } from "react-native";
import { Spinner } from "@ledgerhq/lumen-ui-rnative";

/** What the drawer shows whenever the user has nothing to do: same as the signing drawer. */
export function ExchangeSpinner({ testID }: Readonly<{ testID: string }>) {
  return (
    <View
      style={{
        flex: 1,
        height: "100%",
        minHeight: 320,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spinner size={32} testID={testID} />
    </View>
  );
}
