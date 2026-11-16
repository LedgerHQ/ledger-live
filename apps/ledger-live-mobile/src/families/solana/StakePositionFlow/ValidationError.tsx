import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { abandonStakePosition } from "@features/flow-stake-position";
import SafeAreaView from "~/components/SafeAreaView";
import ValidateError from "~/components/ValidateError";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import type { SolanaStakePositionFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    SolanaStakePositionFlowParamList,
    ScreenName.SolanaStakePositionValidationError
  >
>;

export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { requestId, error } = route.params;

  const onClose = useCallback(() => {
    abandonStakePosition(requestId);
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation, requestId]);

  const onRetry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ValidateError error={error} onRetry={onRetry} onClose={onClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
