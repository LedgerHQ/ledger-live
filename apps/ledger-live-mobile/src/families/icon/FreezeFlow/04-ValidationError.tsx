import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrackScreen } from "../../../analytics";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation, StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import ValidateError from "../../../components/ValidateError";
import { ScreenName } from "../../../const";
import { IconFreezeFlowParamList } from "./type";

type NavigatorProps = CompositeScreenProps<
  StackNavigatorProps<
    IconFreezeFlowParamList,
    ScreenName.IconFreezeValidationError
  >,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function ValidationError({ navigation, route }: NavigatorProps) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    navigation
      .getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()
      .pop();
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
      <TrackScreen category="IconFreezeFlow" name="IconFreezeValidationError" />
      <ValidateError
        error={route.params.error}
        onRetry={retry}
        onClose={onClose}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
