import React, { useCallback } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { TrackScreen } from "~/analytics";
import ValidateError from "~/components/ValidateError";
import { ScreenName } from "~/const";
import type {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { TezosStakeFlowParamList } from "./types";

type Props = StackNavigatorProps<TezosStakeFlowParamList, ScreenName.TezosStakeValidationError>;

export default function ValidationError() {
  const navigation = useNavigation<Props["navigation"]>();
  const route = useRoute<Props["route"]>();
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);
  const retry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="TezosStakeFlow"
        name="ValidationError"
        flow="stake"
        action="stake"
        currency="xtz"
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
