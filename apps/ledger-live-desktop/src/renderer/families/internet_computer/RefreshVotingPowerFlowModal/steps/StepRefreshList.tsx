import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getSecondsTillVotingPowerExpires } from "@ledgerhq/live-common/families/internet_computer/neuron";
import type {
  ICPNeuron,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import React, { useCallback, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import Text from "~/renderer/components/Text";
import NeuronList, { type NeuronColumn } from "../../components/NeuronList";
import { useFormatDuration } from "../../useFormatDuration";
import type { StepProps } from "../../neuronFlow/types";

const COLUMNS: readonly NeuronColumn[] = [
  { key: "id", label: <Trans i18nKey="internetComputer.common.neuronId" />, width: "34%" },
  {
    key: "expiry",
    label: <Trans i18nKey="internetComputer.refreshVotingPowerFlow.timeUntilLoss" />,
    width: "40%",
  },
  {
    key: "action",
    label: <Trans i18nKey="internetComputer.common.action" />,
    width: "26%",
    align: "right",
  },
];

// Matches the key NeuronList rows on, so the countdown lookup cannot drift from the rendered row.
const rowKey = (neuron: ICPNeuron) => neuron.id?.toString() ?? neuron.accountIdentifier;

/**
 * Lists the neurons whose voting power is on a periodic-confirmation clock, soonest first. Neurons
 * the canister reported no refresh timestamp for are left out: their staleness is unknown, and
 * showing them as expiring would be a guess.
 */
const StepRefreshList = ({
  account,
  neurons,
  error,
  onChangeTransaction,
  setLastAction,
  setSelectedNeuronId,
  transitionTo,
}: StepProps) => {
  const { t } = useTranslation();
  const formatDuration = useFormatDuration();
  const bridge = useAccountBridge<Transaction>(account);

  // The countdown is measured once for the whole list. Reading it inside the comparator would let
  // the clock tick between comparisons, which breaks the ordering contract and can reorder rows.
  const { expiring, secondsFor } = useMemo(() => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const entries = neurons
      .map(neuron => ({ neuron, seconds: getSecondsTillVotingPowerExpires(neuron, nowSeconds) }))
      .filter(
        (entry): entry is { neuron: ICPNeuron; seconds: number } => entry.seconds !== undefined,
      )
      .sort((a, b) => a.seconds - b.seconds);
    const byKey = new Map(entries.map(({ neuron, seconds }) => [rowKey(neuron), seconds]));
    return {
      expiring: entries.map(({ neuron }) => neuron),
      secondsFor: (neuron: ICPNeuron) => byKey.get(rowKey(neuron)) ?? 0,
    };
  }, [neurons]);

  const onConfirm = useCallback(
    (neuron: ICPNeuron) => {
      const neuronId = neuron.id?.toString();
      if (!neuronId) return;
      const transaction = bridge.createTransaction(account);
      onChangeTransaction(
        bridge.updateTransaction(transaction, { type: "refresh_voting_power", neuronId }),
      );
      setSelectedNeuronId(neuronId);
      setLastAction("refresh_voting_power");
      transitionTo("manageAction");
    },
    [account, bridge, onChangeTransaction, setLastAction, setSelectedNeuronId, transitionTo],
  );

  const renderCell = useCallback(
    (neuron: ICPNeuron, columnKey: string) => {
      switch (columnKey) {
        case "id":
          return (
            <Text ff="Inter|SemiBold" fontSize={3} color="neutral.c100">
              {neuron.id?.toString() ?? "-"}
            </Text>
          );
        case "expiry": {
          const seconds = secondsFor(neuron);
          return (
            <Text
              ff="Inter|Regular"
              fontSize={3}
              color={seconds > 0 ? "neutral.c100" : "warning.c70"}
            >
              {seconds > 0
                ? formatDuration(seconds)
                : t("internetComputer.refreshVotingPowerFlow.expired")}
            </Text>
          );
        }
        case "action":
          return (
            <Button
              primary
              small
              onClick={() => onConfirm(neuron)}
              data-testid="icp-confirm-following-button"
            >
              <Trans i18nKey="internetComputer.refreshVotingPowerFlow.confirm" />
            </Button>
          );
        default:
          return null;
      }
    },
    [formatDuration, onConfirm, secondsFor, t],
  );

  if (error) return <ErrorDisplay error={error} withExportLogs />;

  return (
    <Box flow={4}>
      <TrackPage
        category="Refresh Voting Power ICP Flow"
        name="Step ListNeuron"
        flow="stake"
        action="refreshVotingPower"
        currency={account.currency.id}
      />
      <Text ff="Inter|Regular" fontSize={4} color="neutral.c70">
        <Trans i18nKey="internetComputer.refreshVotingPowerFlow.description" />
      </Text>
      <NeuronList
        neurons={expiring}
        columns={COLUMNS}
        renderCell={renderCell}
        emptyState={
          <Box p={4} alignItems="center">
            <Text ff="Inter|Regular" fontSize={4} color="neutral.c70">
              <Trans i18nKey="internetComputer.refreshVotingPowerFlow.empty" />
            </Text>
          </Box>
        }
      />
    </Box>
  );
};

export const StepRefreshListFooter = ({ onClose }: StepProps) => (
  <Box horizontal justifyContent="flex-end" width="100%">
    <Button onClick={onClose}>
      <Trans i18nKey="common.close" />
    </Button>
  </Box>
);

export default StepRefreshList;
