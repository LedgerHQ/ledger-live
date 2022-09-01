import React, { useCallback } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import ValidateError from "../../../components/ValidateError";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { LendingEnableFlowParamsList } from "../../../components/RootNavigator/types/LendingEnableFlowNavigator";
import { ScreenName } from "../../../const";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";

export default function ValidationError({
  navigation,
  route,
}: StackNavigatorProps<
  LendingEnableFlowParamsList,
  ScreenName.LendingEnableValidationError
>) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    navigation
      .getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()
      .pop();
  }, [navigation]);
  const retry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  const { error, currency } = route.params;
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
        category="Lend Approve"
        name="Fail"
        eventProperties={{
          currencyName: currency?.name,
        }}
      />
      <ValidateError error={error} onRetry={retry} onClose={onClose} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
