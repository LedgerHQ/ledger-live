import React, { useCallback } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "~/analytics";
import ValidateError from "~/components/ValidateError";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { PolkadotNominateFlowParamList } from "./types";
import { ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

type Props = BaseComposite<
  StackNavigatorProps<PolkadotNominateFlowParamList, ScreenName.PolkadotNominateValidationError>
>;
export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
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
        category="NominateFlow"
        name="ValidationError"
        flow="stake"
        action="nomination"
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
