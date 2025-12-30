import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { getSecondsTillVotingPowerExpires } from "@ledgerhq/live-common/families/internet_computer/utils";
import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import List from "../../components/List";
import { StepProps } from "../types";

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
  onChangeTransaction,
  transitionTo,
  needsRefresh,
  setNeedsRefresh,
  setLastManageAction,
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

  // TODO: duplicate code from Manage.tsx
  const onClickConfirmFollowing = useCallback(
    (neuron: ICPNeuron) => {
      if (account.type !== "Account") return;
      const bridge = getAccountBridge(account);
      const initTx = bridge.createTransaction(account);
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          type: "refresh_voting_power",
          neuronId: neuron.id[0]?.id.toString(),
        }),
      );
      setLastManageAction("refresh_voting_power");
      transitionTo("device");
    },
    [account, onChangeTransaction, transitionTo, setLastManageAction],
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
        <List
          neurons={{
            fullNeurons: neurons.fullNeurons.sort(
              (a, b) => getSecondsTillVotingPowerExpires(a) - getSecondsTillVotingPowerExpires(b),
            ),
            lastUpdatedMSecs: neurons.lastUpdatedMSecs,
          }}
          modalName="MODAL_ICP_REFRESH_VOTING_POWER"
          unit={unit}
          onClickConfirmFollowing={onClickConfirmFollowing}
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Undelegation ICP Flow"
          name="Step Confirmation Error"
          flow="stake"
          action="refreshVotingPower"
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
