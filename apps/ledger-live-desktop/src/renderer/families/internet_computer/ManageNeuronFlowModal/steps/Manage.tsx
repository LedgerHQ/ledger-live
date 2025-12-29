import React from "react";
import styled from "styled-components";
import BigNumber from "bignumber.js";
import { Divider } from "@ledgerhq/react-ui";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import { StepProps } from "../types";
import {
  getNeuronVotingPower,
  getNeuronAgeBonus,
  getNeuronDissolveDelayBonus,
  getSecondsTillVotingPowerExpires,
  isDeviceControlledNeuron,
} from "@ledgerhq/live-common/families/internet_computer/utils";
import { useNeuronActions } from "./hooks/useNeuronActions";
import {
  NeuronHeader,
  VotingPowerSection,
  MaturitySection,
  HotKeysSection,
  AdvancedDetailsSection,
  FollowingSection,
} from "./components";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
  padding: "24px",
}))`
  max-width: 800px;
`;

export default function StepManage({
  account,
  manageNeuronIndex,
  neurons,
  onChangeTransaction,
  transitionTo,
  openModal,
  setLastManageAction,
}: StepProps) {
  const currencyId = account.currency.id;
  const unit = account.currency.units[0];
  const neuron = neurons.fullNeurons[manageNeuronIndex];

  const neuronId = neuron?.id[0]?.id.toString() ?? "";
  const secondsTillVotingPowerExpires = BigNumber(getSecondsTillVotingPowerExpires(neuron));
  const votingPower = getNeuronVotingPower(neuron);
  const ageBonus = getNeuronAgeBonus(neuron);
  const dissolveDelayBonus = getNeuronDissolveDelayBonus(neuron);
  const isDeviceControlled = isDeviceControlledNeuron(neuron, account.xpub || "");

  const {
    onClickIncreaseStake,
    onClickDisburseStake,
    onClickConfirmFollowing,
    onClickStartStopDissolving,
    onClickAutoStakeMaturity,
    onClickFollow,
    onClickSplitNeuron,
    onClickAddHotKey,
    onClickRemoveHotKey,
    onClickSpawnNeuron,
    onClickSetDissolveDelay,
    onClickStakeMaturity,
  } = useNeuronActions({
    account,
    neuron,
    manageNeuronIndex,
    openModal,
    onChangeTransaction,
    transitionTo,
    setLastManageAction,
  });

  if (!neuron) {
    return null;
  }

  return (
    <Container>
      <TrackPage
        category="Manage Neurons ICP Flow"
        name="Step Manage"
        flow="stake"
        action="manageNeuron"
        currency={currencyId}
      />

      <NeuronHeader
        stakeAmount={neuron.cached_neuron_stake_e8s}
        neuronId={neuronId}
        votingPower={votingPower}
        isDeviceControlled={isDeviceControlled}
        unit={unit}
      />

      <Divider my={6} width={"100%"} />

      <VotingPowerSection
        neuron={neuron}
        votingPower={votingPower}
        ageBonus={ageBonus}
        dissolveDelayBonus={dissolveDelayBonus}
        secondsTillVotingPowerExpires={secondsTillVotingPowerExpires}
        isDeviceControlled={isDeviceControlled}
        unit={unit}
        onClickIncreaseStake={onClickIncreaseStake}
        onClickDisburseStake={onClickDisburseStake}
        onClickStartStopDissolving={onClickStartStopDissolving}
        onClickSetDissolveDelay={onClickSetDissolveDelay}
        onClickConfirmFollowing={onClickConfirmFollowing}
      />

      <Divider my={6} width={"100%"} />

      <MaturitySection
        neuron={neuron}
        isDeviceControlled={isDeviceControlled}
        unit={unit}
        onClickStakeMaturity={onClickStakeMaturity}
        onClickSpawnNeuron={onClickSpawnNeuron}
      />

      <Divider my={6} width={"100%"} />

      <HotKeysSection
        neuron={neuron}
        isDeviceControlled={isDeviceControlled}
        onClickAddHotKey={onClickAddHotKey}
        onClickRemoveHotKey={onClickRemoveHotKey}
      />

      <Divider my={6} width={"100%"} />

      <AdvancedDetailsSection
        neuron={neuron}
        neuronId={neuronId}
        isDeviceControlled={isDeviceControlled}
        onClickSplitNeuron={onClickSplitNeuron}
        onClickAutoStakeMaturity={onClickAutoStakeMaturity}
      />

      <Divider my={6} width={"100%"} />

      <FollowingSection neuron={neuron} onClickFollow={onClickFollow} />
    </Container>
  );
}
