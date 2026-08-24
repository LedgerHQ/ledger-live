import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import {
  getNeuronDissolveDurationSeconds,
  neuronStake,
  votingPowerNeedsRefresh,
} from "@ledgerhq/live-common/families/internet_computer/neuron";
import {
  getNeuronState,
  useICPNeurons,
} from "@ledgerhq/live-common/families/internet_computer/react";
import type {
  ICPAccount,
  ICPNeuron,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import invariant from "invariant";
import React, { useCallback } from "react";
import { TrackScreen } from "~/analytics";
import Alert from "~/components/Alert";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import SafeAreaView from "~/components/SafeAreaView";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { toBigNumber } from "../amounts";
import NeuronList from "../components/NeuronList";
import { useFormatDuration } from "../useFormatDuration";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = StackNavigatorProps<
  InternetComputerNeuronManageFlowParamList,
  ScreenName.InternetComputerNeuronList
>;

export default function NeuronListScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const formatDuration = useFormatDuration();
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "internet_computer account required");

  const icpAccount = account as ICPAccount;
  const unit = useAccountUnit(icpAccount);
  const neurons = useICPNeurons(icpAccount);
  const bridge = useAccountBridge<Transaction>(icpAccount);
  const lastUpdatedMSecs = icpAccount.neurons?.lastUpdatedMSecs;

  const decaying = votingPowerNeedsRefresh(neurons);

  const onRefreshVotingPower = useCallback(
    () =>
      navigation.navigate(ScreenName.InternetComputerNeuronRefreshVotingPower, {
        accountId: icpAccount.id,
        parentId: route.params.parentId,
      }),
    [icpAccount.id, navigation, route.params.parentId],
  );

  const onPressNeuron = useCallback(
    (neuron: ICPNeuron) => {
      const neuronId = neuron.id?.toString();
      if (!neuronId) return;
      navigation.navigate(ScreenName.InternetComputerNeuronDetails, {
        ...route.params,
        accountId: icpAccount.id,
        neuronId,
      });
    },
    [icpAccount.id, navigation, route.params],
  );

  // Neurons are never refreshed by background sync — only a device-signed list_neurons updates
  // them, so the user has to ask for it explicitly.
  const onSync = useCallback(() => {
    const transaction = bridge.createTransaction(icpAccount);
    navigation.navigate(ScreenName.InternetComputerNeuronSelectDevice, {
      ...route.params,
      accountId: icpAccount.id,
      transaction: bridge.updateTransaction(transaction, { type: "list_neurons" }),
    });
  }, [bridge, icpAccount, navigation, route.params]);

  const renderNeuron = useCallback(
    (neuron: ICPNeuron) => {
      const dissolveDelay = getNeuronDissolveDurationSeconds(neuron);
      return (
        <>
          <Flex flexDirection="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Text variant="body" fontWeight="semiBold" color="neutral.c100" numberOfLines={1}>
              {neuron.id?.toString() ?? "-"}
            </Text>
            <Text variant="small" color="neutral.c70">
              {t(`internetComputer.neuronState.${getNeuronState(neuron)}`)}
            </Text>
          </Flex>
          <Row label={t("internetComputer.common.stake")}>
            <CurrencyUnitValue
              disableRounding
              showCode
              unit={unit}
              value={toBigNumber(neuronStake(neuron))}
            />
          </Row>
          <Row label={t("internetComputer.common.maturity")}>
            <CurrencyUnitValue
              disableRounding
              showCode
              unit={unit}
              value={toBigNumber(neuron.maturityE8sEquivalent + neuron.stakedMaturityE8sEquivalent)}
            />
          </Row>
          <Row label={t("internetComputer.common.dissolveDelay")}>
            {dissolveDelay > 0n ? formatDuration(dissolveDelay) : "-"}
          </Row>
        </>
      );
    },
    [formatDuration, t, unit],
  );

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen
        category="Manage Neurons ICP Flow"
        name="NeuronList"
        flow="stake"
        action="listNeurons"
        currency={icpAccount.currency.id}
      />
      <SyncOneAccountOnMount
        reason="transaction-flow-confirmation"
        priority={10}
        accountId={icpAccount.id}
      />
      <NeuronList
        neurons={neurons}
        renderNeuron={renderNeuron}
        onPressNeuron={onPressNeuron}
        header={
          // Desktop reaches the confirm-following screen from the account's stake banner, which
          // mobile does not have yet, so the only route to it is from here — and only when
          // something is actually decaying, since confirming otherwise is a no-op.
          decaying ? (
            <Flex mb={4}>
              <Alert
                type="warning"
                title={t("internetComputer.refreshVotingPowerFlow.description")}
              />
              <Button
                type="main"
                mt={4}
                onPress={onRefreshVotingPower}
                testID="icp-refresh-voting-power-button"
              >
                {t("internetComputer.refreshVotingPowerFlow.title")}
              </Button>
            </Flex>
          ) : null
        }
        emptyState={t("internetComputer.manageNeuronFlow.listNeuron.empty")}
      />
      <Flex p={6} style={{ gap: 12 }}>
        <Text variant="small" color="neutral.c70" textAlign="center">
          {t("internetComputer.manageNeuronFlow.listNeuron.lastSynced", {
            date: lastUpdatedMSecs
              ? new Date(lastUpdatedMSecs).toLocaleString()
              : t("internetComputer.manageNeuronFlow.listNeuron.never"),
          })}
        </Text>
        <Button type="main" onPress={onSync} testID="icp-sync-neurons-button">
          {t("internetComputer.manageNeuronFlow.listNeuron.sync")}
        </Button>
      </Flex>
    </SafeAreaView>
  );
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Flex flexDirection="row" justifyContent="space-between" alignItems="center" py={1}>
    <Text variant="small" color="neutral.c70">
      {label}
    </Text>
    <Text variant="small" color="neutral.c100">
      {children}
    </Text>
  </Flex>
);
