import React, { useCallback } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import { TrackScreen } from "~/analytics";
import ValidateError from "~/components/ValidateError";
import { BaseComposite, BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { PolkadotUnbondFlowParamList } from "./type";

type NavigationProps = BaseComposite<
  StackScreenProps<PolkadotUnbondFlowParamList, ScreenName.PolkadotUnbondValidationError>
>;

export default function ValidationError({ navigation, route }: NavigationProps) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    navigation.getParent<BaseNavigation>().pop();
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
        category="UnbondFlow"
        name="ValidationError"
        flow="stake"
        action="withdraw_unbonded"
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
