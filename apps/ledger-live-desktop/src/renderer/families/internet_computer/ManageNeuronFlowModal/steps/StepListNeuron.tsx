import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getNeuronDissolveDurationSeconds } from "@ledgerhq/live-common/families/internet_computer/neuron";
import { getNeuronState } from "@ledgerhq/live-common/families/internet_computer/react";
import type {
  ICPNeuron,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import NeuronList, { type NeuronColumn } from "../../components/NeuronList";
import { toBigNumber } from "../../amounts";
import { useFormatDuration } from "../../useFormatDuration";
import type { StepProps } from "../../neuronFlow/types";

const COLUMNS: readonly NeuronColumn[] = [
  { key: "id", label: <Trans i18nKey="internetComputer.common.neuronId" />, width: "26%" },
  { key: "stake", label: <Trans i18nKey="internetComputer.common.stake" />, width: "22%" },
  { key: "maturity", label: <Trans i18nKey="internetComputer.common.maturity" />, width: "20%" },
  {
    key: "dissolveDelay",
    label: <Trans i18nKey="internetComputer.common.dissolveDelay" />,
    width: "20%",
  },
  { key: "state", label: <Trans i18nKey="internetComputer.common.state" />, width: "12%" },
];

const StepListNeuron = ({
  account,
  neurons,
  error,
  setSelectedNeuronId,
  transitionTo,
}: StepProps) => {
  const { t } = useTranslation();
  const formatDuration = useFormatDuration();
  const unit = account.currency.units[0];

  const onRowClick = useCallback(
    (neuron: ICPNeuron) => {
      const neuronId = neuron.id?.toString();
      if (!neuronId) return;
      setSelectedNeuronId(neuronId);
      transitionTo("manage");
    },
    [setSelectedNeuronId, transitionTo],
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
        case "stake":
          return (
            <FormattedVal
              val={toBigNumber(neuron.cachedNeuronStakeE8s)}
              unit={unit}
              showCode
              fontSize={3}
              color="neutral.c100"
            />
          );
        case "maturity":
          return (
            <FormattedVal
              val={toBigNumber(neuron.maturityE8sEquivalent + neuron.stakedMaturityE8sEquivalent)}
              unit={unit}
              fontSize={3}
              color="neutral.c100"
            />
          );
        case "dissolveDelay": {
          const seconds = getNeuronDissolveDurationSeconds(neuron);
          return (
            <Text ff="Inter|Regular" fontSize={3} color="neutral.c100">
              {seconds > 0n ? formatDuration(seconds) : "-"}
            </Text>
          );
        }
        case "state":
          return (
            <Text ff="Inter|Regular" fontSize={3} color="neutral.c100">
              {t(`internetComputer.neuronState.${getNeuronState(neuron)}`)}
            </Text>
          );
        default:
          return null;
      }
    },
    [formatDuration, t, unit],
  );

  if (error) {
    return <ErrorDisplay error={error} withExportLogs />;
  }

  return (
    <Box flow={4}>
      <TrackPage
        category="Manage Neurons ICP Flow"
        name="Step ListNeuron"
        flow="stake"
        action="listNeurons"
        currency={account.currency.id}
      />
      <SyncOneAccountOnMount
        reason="transaction-flow-confirmation"
        priority={10}
        accountId={account.id}
      />
      <NeuronList
        neurons={neurons}
        columns={COLUMNS}
        renderCell={renderCell}
        onRowClick={onRowClick}
        emptyState={
          <Box p={4} alignItems="center">
            <Text ff="Inter|Regular" fontSize={4} color="neutral.c70">
              <Trans i18nKey="internetComputer.manageNeuronFlow.listNeuron.empty" />
            </Text>
          </Box>
        }
      />
    </Box>
  );
};

export const StepListNeuronFooter = ({
  account,
  lastUpdatedMSecs,
  onChangeTransaction,
  onClose,
  setLastAction,
  transitionTo,
}: StepProps) => {
  const { t } = useTranslation();
  const bridge = useAccountBridge<Transaction>(account);

  // Neurons are never refreshed by background sync — only a device-signed list_neurons updates them,
  // so the user has to ask for it explicitly.
  const onClickSync = useCallback(() => {
    const transaction = bridge.createTransaction(account);
    onChangeTransaction(bridge.updateTransaction(transaction, { type: "list_neurons" }));
    setLastAction("list_neurons");
    transitionTo("device");
  }, [account, bridge, onChangeTransaction, setLastAction, transitionTo]);

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" width="100%">
      <Text ff="Inter|SemiBold" fontSize={3} color="neutral.c70">
        {t("internetComputer.manageNeuronFlow.listNeuron.lastSynced", {
          date: lastUpdatedMSecs ? new Date(lastUpdatedMSecs).toLocaleString() : t("common.never"),
        })}
      </Text>
      <Box horizontal>
        <Button onClick={onClose}>
          <Trans i18nKey="common.close" />
        </Button>
        <Button primary ml={2} onClick={onClickSync} data-testid="icp-sync-neurons-button">
          <Trans i18nKey="internetComputer.manageNeuronFlow.listNeuron.sync" />
        </Button>
      </Box>
    </Box>
  );
};

export default StepListNeuron;
