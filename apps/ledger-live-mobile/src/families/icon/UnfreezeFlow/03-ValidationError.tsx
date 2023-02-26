import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps, StackNavigatorNavigation } from "../../../components/RootNavigator/types/helpers";
import ValidateError from "../../../components/ValidateError";
import { ScreenName } from "../../../const";
import { IconUnfreezeFlowParamList } from "./type";

type Props = CompositeScreenProps<
  StackNavigatorProps<
    IconUnfreezeFlowParamList,
    ScreenName.IconUnfreezeValidationError
  >,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;
export default function IconUnValidationError({ navigation, route }: Props) {
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
      <TrackScreen category="UnfreezeFunds" name="ValidationError" />
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
