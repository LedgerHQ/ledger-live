import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { TrackScreen } from "~/analytics";
import ValidateError from "~/components/ValidateError";

import { ScreenName } from "~/const";
import type { SignMessageNavigatorStackParamList } from "~/components/RootNavigator/types/SignMessageNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";

type Navigation = CompositeScreenProps<
  StackNavigatorProps<SignMessageNavigatorStackParamList, ScreenName.SignValidationError>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function ValidationError({ navigation, route }: Navigation) {
  const { colors } = useTheme();
  const { error, onFailHandler } = route.params;

  const onClose = useCallback(() => {
    if (onFailHandler && error) {
      onFailHandler(error);
    }
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [error, navigation, onFailHandler]);
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
      <TrackScreen category="SignMessage" name="ValidationError" />
      {error && <ValidateError error={error} onRetry={retry} onClose={onClose} />}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
