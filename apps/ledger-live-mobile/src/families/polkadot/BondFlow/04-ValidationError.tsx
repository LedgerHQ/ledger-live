import React, { useCallback } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { TrackScreen } from "~/analytics";
import ValidateError from "~/components/ValidateError";

type Props = {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
  route: {
    params: RouteParams;
  };
};
type RouteParams = {
  accountId: string;
  deviceId: string;
  transaction: Transaction;
  error: Error;
};
export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigationProp<Record<string, object | undefined>>>().pop();
  }, [navigation]);
  const retry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen
        category="BondFlow"
        name="ValidationError"
        flow="stake"
        action="bond"
        currency="dot"
      />
      <ValidateError error={route.params.error} onRetry={retry} onClose={onClose} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
