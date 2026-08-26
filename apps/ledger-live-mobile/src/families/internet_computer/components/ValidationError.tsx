import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { TrackScreen } from "~/analytics";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import SafeAreaView from "~/components/SafeAreaView";
import ValidateError from "~/components/ValidateError";
import { ScreenName } from "~/const";
import type { InternetComputerNeuronManageFlowParamList } from "../NeuronManageFlow/types";
import type { InternetComputerStakingFlowParamList } from "../StakingFlow/types";

type Props = Readonly<
  (
    | BaseComposite<
        StackNavigatorProps<
          InternetComputerNeuronManageFlowParamList,
          ScreenName.InternetComputerNeuronValidationError
        >
      >
    | BaseComposite<
        StackNavigatorProps<
          InternetComputerStakingFlowParamList,
          ScreenName.InternetComputerStakingValidationError
        >
      >
  ) & {
    /** Analytics category; the two ICP flows report separately. */
    category: string;
    /** Analytics action: the transaction type this flow was signing when it failed. */
    action?: string;
  }
>;

/** The failure tail both ICP flows share. Retry goes back a screen; close leaves the flow. */
export default function ICPValidationError({ navigation, route, category, action }: Props) {
  const { colors } = useTheme();

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const retry = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category={category} name="ValidationError" flow="stake" action={action} />
      <ValidateError error={route.params.error} onRetry={retry} onClose={onClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
