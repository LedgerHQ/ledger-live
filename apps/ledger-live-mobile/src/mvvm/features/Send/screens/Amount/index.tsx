import React, { useCallback } from "react";
import { View, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { ScreenName } from "~/const";
import { SendFlowLayout } from "../../components/SendFlowLayout";
import type { SendFlowNavigationProp } from "../../types";

export function AmountScreen() {
  const navigation = useNavigation<SendFlowNavigationProp>();

  const handleContinue = useCallback(() => {
    navigation.navigate(ScreenName.SendFlowConfirmation);
  }, [navigation]);

  return (
    <SendFlowLayout>
      <View style={{ flex: 1 }}>
        <Text typography="body2" lx={{ color: "muted", marginBottom: "s24" }}>
          {"Amount screen"}
        </Text>
        <Button title="Continue" onPress={handleContinue} />
      </View>
    </SendFlowLayout>
  );
}
