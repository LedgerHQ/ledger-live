import React from "react";
import { View } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { SendFlowLayout } from "../../components/SendFlowLayout";

export function SignatureScreen() {
  return (
    <SendFlowLayout>
      <View style={{ flex: 1 }}>
        <Text typography="body2" lx={{ color: "muted" }}>
          {"Signature screen"}
        </Text>
      </View>
    </SendFlowLayout>
  );
}
