import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import {
  getSecondsTillVotingPowerExpires,
  votingPowerNeedsRefresh,
} from "@ledgerhq/live-common/families/internet_computer/neuron";
import { useICPNeurons } from "@ledgerhq/live-common/families/internet_computer/react";
import type {
  ICPAccount,
  ICPNeuron,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { TrackScreen } from "~/analytics";
import SafeAreaView from "~/components/SafeAreaView";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import NeuronList, { neuronKey } from "../components/NeuronList";
import { useFormatDuration } from "../useFormatDuration";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = StackNavigatorProps<
  InternetComputerNeuronManageFlowParamList,
  ScreenName.InternetComputerNeuronRefreshVotingPower
>;

/**
 * Lists the neurons whose voting power is on a periodic-confirmation clock, soonest first. Neurons
 * the canister reported no refresh timestamp for are left out: their staleness is unknown, and
 * showing them as expiring would be a guess.
 *
 * A neuron only starts losing power in the last month of that clock, which no reading of the
 * countdown alone reveals, so the row says so outright. Confirming earlier is allowed — the NNS
 * takes it at any time — which is why the healthy ones stay listed rather than being filtered out.
 */
export default function RefreshVotingPower({ navigation, route }: Props) {
  const { t } = useTranslation();
  const formatDuration = useFormatDuration();
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "internet_computer account required");

  const icpAccount = account as ICPAccount;
  const neurons = useICPNeurons(icpAccount);
  const bridge = useAccountBridge<Transaction>(icpAccount);

  // The countdown is measured once for the whole list. Reading it inside the comparator would let
  // the clock tick between comparisons, which breaks the ordering contract and can reorder rows.
  const { expiring, stateFor } = useMemo(() => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const entries = neurons
      .map(neuron => ({ neuron, seconds: getSecondsTillVotingPowerExpires(neuron, nowSeconds) }))
      .filter(
        (entry): entry is { neuron: ICPNeuron; seconds: number } => entry.seconds !== undefined,
      )
      .sort((a, b) => a.seconds - b.seconds);
    const byKey = new Map(
      entries.map(({ neuron, seconds }) => [
        neuronKey(neuron),
        { seconds, decaying: votingPowerNeedsRefresh([neuron], nowSeconds) },
      ]),
    );
    return {
      expiring: entries.map(({ neuron }) => neuron),
      stateFor: (neuron: ICPNeuron) =>
        byKey.get(neuronKey(neuron)) ?? { seconds: 0, decaying: true },
    };
  }, [neurons]);

  const onConfirm = useCallback(
    (neuron: ICPNeuron) => {
      const neuronId = neuron.id?.toString();
      if (!neuronId) return;
      const transaction = bridge.createTransaction(icpAccount);
      navigation.navigate(ScreenName.InternetComputerNeuronSelectDevice, {
        ...route.params,
        accountId: icpAccount.id,
        neuronId,
        transaction: bridge.updateTransaction(transaction, {
          type: "refresh_voting_power",
          neuronId,
        }),
      });
    },
    [bridge, icpAccount, navigation, route.params],
  );

  const renderNeuron = useCallback(
    (neuron: ICPNeuron) => {
      const { seconds, decaying } = stateFor(neuron);
      return (
        <>
          <Text variant="body" fontWeight="semiBold" color="neutral.c100" numberOfLines={1}>
            {neuron.id?.toString() ?? "-"}
          </Text>
          <Text variant="small" color="neutral.c70" mt={1}>
            {t("internetComputer.refreshVotingPowerFlow.timeUntilLoss")}
          </Text>
          {seconds === 0 ? (
            <Text variant="body" color="error.c60" mt={1}>
              {t("internetComputer.refreshVotingPowerFlow.expired")}
            </Text>
          ) : (
            <Text variant="body" color={decaying ? "warning.c70" : "neutral.c100"} mt={1}>
              {decaying
                ? t("internetComputer.refreshVotingPowerFlow.losing", {
                    duration: formatDuration(seconds),
                  })
                : formatDuration(seconds)}
            </Text>
          )}
          <Button
            type="main"
            size="small"
            mt={4}
            onPress={() => onConfirm(neuron)}
            testID="icp-confirm-following-button"
          >
            {t("internetComputer.refreshVotingPowerFlow.confirm")}
          </Button>
        </>
      );
    },
    [formatDuration, onConfirm, stateFor, t],
  );

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen
        category="Refresh Voting Power ICP Flow"
        name="RefreshVotingPower"
        flow="stake"
        action="refreshVotingPower"
        currency={icpAccount.currency.id}
      />
      <NeuronList
        neurons={expiring}
        renderNeuron={renderNeuron}
        header={
          <Flex mb={4}>
            <Text variant="body" color="neutral.c70">
              {t("internetComputer.refreshVotingPowerFlow.description")}
            </Text>
          </Flex>
        }
        emptyState={t("internetComputer.refreshVotingPowerFlow.empty")}
      />
    </SafeAreaView>
  );
}
