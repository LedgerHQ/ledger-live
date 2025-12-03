import React, { useCallback, useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import WarnBox from "~/renderer/components/WarnBox";
import List from "../../components/List";
import { StepProps } from "../types";
import Button from "~/renderer/components/Button";

interface ContainerProps {
  shouldSpace?: boolean;
}

const Container = styled(Box).attrs<ContainerProps>(() => ({
  alignItems: "center",
  grow: true,
}))<ContainerProps>`
  width: 100%;
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;

export default function StepListNeuron({
  account,
  error,
  signed,
  neurons,
  setManageNeuronIndex,
  onChangeTransaction,
  transitionTo,
  needsRefresh,
  setNeedsRefresh,
}: StepProps) {
  const { t } = useTranslation();
  const currencyId = account.currency.id;
  const unit = account.currency.units[0];

  useEffect(() => {
    if (needsRefresh) {
      const bridge = getAccountBridge(account);
      const initTx = bridge.createTransaction(account);
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          type: "list_neurons",
        }),
      );
      setNeedsRefresh(false);
      transitionTo("device");
    }
  }, [needsRefresh, transitionTo, account, onChangeTransaction, setNeedsRefresh]);

  const onClickManage = useCallback(
    (index: number) => {
      if (account.type !== "Account") return;
      setManageNeuronIndex(index);
      transitionTo("manage");
    },
    [account.type, transitionTo, setManageNeuronIndex],
  );

  if (neurons) {
    return (
      <Container>
        <TrackPage
          category="Manage Neurons ICP Flow"
          name="Step Confirmed"
          flow="stake"
          action="listNeurons"
          currency={currencyId}
        />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={account.id}
        />
        {neurons.fullNeurons.length > 0 && (
          <WarnBox>
            <Trans i18nKey="internetComputer.manageNeuronFlow.listNeuron.warnbox" />
          </WarnBox>
        )}
        <List
          neurons={{
            fullNeurons: neurons.fullNeurons.sort(
              (a, b) => Number(b.cached_neuron_stake_e8s) - Number(a.cached_neuron_stake_e8s),
            ),
            lastUpdatedMSecs: neurons.lastUpdatedMSecs,
          }}
          modalName="MODAL_ICP_LIST_NEURONS"
          unit={unit}
          onClickManage={onClickManage}
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Manage Neurons ICP Flow"
          name="Step Confirmation Error"
          flow="stake"
          action="listNeurons"
          currency={currencyId}
        />
        {signed && (
          <BroadcastErrorDisclaimer title={t("internetComputer.confirmation.broadcastError")} />
        )}
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }

  return null;
}

export function StepListNeuronFooter({
  account,
  onClose,
  transitionTo,
  neurons,
  onChangeTransaction,
  setLastManageAction,
  error,
}: StepProps) {
  const currencyName = account.currency.name;
  const onClickSync = useCallback(() => {
    const bridge = getAccountBridge(account);
    const initTx = bridge.createTransaction(account);
    setLastManageAction("list_neurons");
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        type: "list_neurons",
      }),
    );
    transitionTo("device");
  }, [account, onChangeTransaction, transitionTo, setLastManageAction]);

  const onRetry = useCallback(() => {
    transitionTo("manage");
  }, [transitionTo]);

  const { t } = useTranslation();
  return (
    <Box width="100%" horizontal alignItems="center" justifyContent="space-between">
      <Box ff="Inter|SemiBold" fontSize={4} color="palette.text.shade60">
        {t("internetComputer.lastSynced")
          .concat(": ")
          .concat(
            neurons.lastUpdatedMSecs
              ? new Date(neurons.lastUpdatedMSecs).toLocaleString()
              : t("common.never"),
          )}
      </Box>
      <Box horizontal>
        <Button ml={2} onClick={onClose}>
          <Trans i18nKey="common.close" />
        </Button>
        <Button
          outline
          ml={2}
          event={`Manage Neurons ${currencyName} Manage Neurons Flow Step 2 Sync Neurons Clicked`}
          onClick={error ? onRetry : onClickSync}
        >
          {error ? <Trans i18nKey="common.retry" /> : <Trans i18nKey="internetComputer.sync" />}
        </Button>
      </Box>
    </Box>
  );
}
