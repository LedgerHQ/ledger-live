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
     * Where to send a user whose attempt must not be repeated. Only the manage flow supplies one —
     * its neuron list is where Refresh neurons lives, which is what establishes what actually
     * happened. Closing the staking flow lands on the account page, which carries the same entry
     * point as a banner.
     */
    onBackToList?: () => void;
  }
>;

/**
 * The screen that collected each action's input, so a value the user needs to change can be changed.
 * Anything absent took no input and retries at the device screen, which is one step back.
 */
const RETRY_SCREEN: Partial<Record<ICPTransactionType, ScreenName>> = {
  increase_stake: ScreenName.InternetComputerNeuronIncreaseStake,
  set_dissolve_delay: ScreenName.InternetComputerNeuronSetDissolveDelay,
  increase_dissolve_delay: ScreenName.InternetComputerNeuronSetDissolveDelay,
  stake_maturity: ScreenName.InternetComputerNeuronStakeMaturity,
  split_neuron: ScreenName.InternetComputerNeuronSplit,
  add_hot_key: ScreenName.InternetComputerNeuronAddHotKey,
  // Back to the followee list rather than the topic picker: the topic is already chosen and the list
  // it holds is what a retry is likely to be correcting.
  follow: ScreenName.InternetComputerNeuronFollowees,
  refresh_voting_power: ScreenName.InternetComputerNeuronRefreshVotingPower,
};

/**
 * Errors that say the command did not take effect: the canister refused it, or the replica refused
 * the message before the canister saw it. Nothing ran, so re-signing repeats nothing.
 */
const NOTHING_EXECUTED = new Set(["ICPGovernanceRejected", "ICPCallRejected"]);

/**
 * Commands a second execution leaves in the same state as the first, so re-signing one is safe even
 * when the first may already have run.
 *
 * The dissolve-delay commands are the counter-example and the reason this is a whitelist: both land
 * on the canister's `increase_dissolve_delay`, which *adds* to the delay the neuron already has, so
 * a second one that executes doubles the change. Split, spawn, disburse and stake_maturity each move
 * funds or mint a neuron, and are equally not repeatable.
 */
const IDEMPOTENT_COMMANDS = new Set<ICPTransactionType>([
  "list_neurons",
  "refresh_voting_power",
  "start_dissolving",
  "stop_dissolving",
  "add_hot_key",
  "remove_hot_key",
  "auto_stake_maturity",
  "follow",
]);

/** The failure tail both ICP flows share. Close leaves the flow; Retry is offered only when safe. */
export default function ICPValidationError({
  navigation,
  route,
  category,
  action,
  onBackToList,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { error, signed, transaction } = route.params;
  const command = transaction?.type;

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const retryScreen = command && RETRY_SCREEN[command];
  // Navigating to a screen already below in the stack returns to it with the transaction the user
  // built still on it. Without an input screen there is nothing to correct, so one step back — the
  // device screen — is where a retry belongs.
  const retry = useCallback(() => {
    if (retryScreen) {
      (navigation as unknown as { navigate: (screen: string) => void }).navigate(retryScreen);
      return;
    }
    navigation.goBack();
  }, [navigation, retryScreen]);

  /*
   * Three ways a retry is safe: the signature never left the device, so nothing was sent; the network
   * answered that the command did not run; or running it twice makes no difference.
   *
   * Everything else is a request that may already be executing, and a retry cannot be a redelivery —
   * the expiry is minted when the call is built, so re-signing produces a new request id and the IC's
   * own de-duplication no longer covers it. Both copies can then take effect, which for an additive
   * command like increase_dissolve_delay means the change applies twice.
   */
  const canRetry =
    !signed || NOTHING_EXECUTED.has(error.name) || (!!command && IDEMPOTENT_COMMANDS.has(command));

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
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
