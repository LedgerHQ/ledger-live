import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrackScreen } from "../../../analytics";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import ValidateError from "../../../components/ValidateError";
import { ScreenName } from "../../../const";
import type { CeloRevokeFlowFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    CeloRevokeFlowFlowParamList,
    ScreenName.CeloRevokeValidationError
  >
>;

export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    navigation
      .getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()
      .pop();
  }, [navigation]);

  const retry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const error = route.params?.error;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="CeloRevoke" name="ValidationError" />
      <ValidateError error={error} onRetry={retry} onClose={onClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
