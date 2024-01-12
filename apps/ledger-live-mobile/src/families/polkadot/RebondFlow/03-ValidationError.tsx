import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import { TrackScreen } from "~/analytics";
import ValidateError from "~/components/ValidateError";
import { BaseComposite, BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { PolkadotRebondFlowParamList } from "./type";
import { ScreenName } from "~/const";

type NavigationProps = BaseComposite<
  StackScreenProps<PolkadotRebondFlowParamList, ScreenName.PolkadotRebondValidationError>
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
        category="RebondFlow"
        name="ValidationError"
        flow="stake"
        action="rebond"
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
