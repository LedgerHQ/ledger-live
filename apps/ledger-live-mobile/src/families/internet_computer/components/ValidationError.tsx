import { canRetryNeuronCommand } from "@ledgerhq/live-common/families/internet_computer/neuron";
import type { ICPTransactionType } from "@ledgerhq/live-common/families/internet_computer/types";
import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { TrackScreen } from "~/analytics";
import Button from "~/components/Button";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import PreventNativeBack from "~/components/PreventNativeBack";
import SafeAreaView from "~/components/SafeAreaView";
import ValidateError from "~/components/ValidateError";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
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
    /**
     * Where to send a user whose attempt must not be repeated. Both flows supply one, and both land
     * on the neuron list: it holds Refresh neurons, the only thing that establishes what the command
     * actually did. Optional because a flow that offered no such destination would still render —
     * Close alone, which is what the staking flow used to do.
     */
    onBackToList?: () => void;
    /**
     * Where each transaction type retries, for the flow this screen is serving.
     *
     * Supplied by the wrapper rather than held here, because a retry target is only reachable from
     * the navigator that registers it: every entry is a screen in one flow's own stack. Keyed on the
     * runtime `command` alone, a map declared here would have let a future staking transaction type
     * reuse a manage-flow key and `popTo` a screen the staking navigator has never heard of.
     */
    retryScreens?: Partial<Record<ICPTransactionType, ScreenName>>;
  }
>;

/** The failure tail both ICP flows share. Close leaves the flow; Retry is offered only when safe. */
export default function ICPValidationError({
  navigation,
  route,
  category,
  action,
  onBackToList,
  retryScreens,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { error, signed, transaction } = route.params;
  const command = transaction?.type;

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const retryScreen = command && retryScreens?.[command];
  // `popTo`, not `navigate`, which pushes a second copy of the screen rather than returning to it.
  // The params travel because `popTo` replaces the target's own, and because the screen need not be
  // in the stack at all: a confirmation reached from a neuron goes straight to the device, so its
  // retry mounts the list for the first time. Without an input screen there is nothing to correct,
  // so a retry belongs one step back, at the device screen.
  const retry = useCallback(() => {
    if (retryScreen) {
      (navigation as unknown as { popTo: (screen: string, params: unknown) => void }).popTo(
        retryScreen,
        route.params,
      );
      return;
    }
    navigation.goBack();
  }, [navigation, retryScreen, route.params]);

  const canRetry = canRetryNeuronCommand({ signed: !!signed, errorName: error.name, command });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Withholding Retry is not enough on Android: this screen replaced the device screen, so
          hardware Back pops to SelectDevice, which auto-selects the last device and signs again.
          Guarded only where a retry was refused — where it was offered, Back is what Retry does. */}
      {!canRetry && <PreventNativeBack />}
      <TrackScreen category={category} name="ValidationError" flow="stake" action={action} />
      <ValidateError
        error={error}
        {...(canRetry && { onRetry: retry })}
        primaryButton={
          canRetry || !onBackToList ? null : (
            <Button
              type="main"
              onPress={onBackToList}
              containerStyle={styles.button}
              testID="icp-back-to-neurons-button"
              title={t("internetComputer.manageNeuronFlow.confirmation.backToNeurons")}
            />
          )
        }
        onClose={onClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  button: {
    alignSelf: "stretch",
    marginTop: 16,
  },
});
