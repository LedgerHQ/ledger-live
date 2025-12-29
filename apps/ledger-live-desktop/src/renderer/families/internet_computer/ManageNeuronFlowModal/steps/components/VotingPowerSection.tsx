import React from "react";
import { Trans } from "react-i18next";
import { useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import { Unit } from "@ledgerhq/types-cryptoassets";
import FormattedVal from "~/renderer/components/FormattedVal";
import {
  ManageModalElementWithAction,
  ManageModalSection,
} from "../../../components/ManageModalComponents";
import {
  getNeuronDissolveDuration,
  secondsToDurationString,
} from "@ledgerhq/live-common/families/internet_computer/utils";
import { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";

type VotingPowerSectionProps = {
  neuron: ICPNeuron;
  votingPower: number;
  ageBonus: number;
  dissolveDelayBonus: number;
  secondsTillVotingPowerExpires: BigNumber;
  isDeviceControlled: boolean;
  unit: Unit;
  onClickIncreaseStake: () => void;
  onClickDisburseStake: () => void;
  onClickStartStopDissolving: () => void;
  onClickSetDissolveDelay: () => void;
  onClickConfirmFollowing: (neuron: ICPNeuron) => void;
};

export function VotingPowerSection({
  neuron,
  votingPower,
  ageBonus,
  dissolveDelayBonus,
  secondsTillVotingPowerExpires,
  isDeviceControlled,
  unit,
  onClickIncreaseStake,
  onClickDisburseStake,
  onClickStartStopDissolving,
  onClickSetDissolveDelay,
  onClickConfirmFollowing,
}: VotingPowerSectionProps) {
  const { t } = useTranslation();

  return (
    <ManageModalSection
      title={t("internetComputer.manageNeuronFlow.manage.votingPower.title")}
      value={
        votingPower > 0 ? (
          <FormattedVal color="palette.text.shade100" val={votingPower} unit={unit} />
        ) : (
          <Trans i18nKey="common.none" />
        )
      }
      titleTooltip={t("internetComputer.manageNeuronFlow.manage.votingPower.titleTooltip")}
    >
      <ManageModalElementWithAction
        label={t("internetComputer.manageNeuronFlow.manage.votingPower.staked")}
        action={[
          {
            label: t("internetComputer.manageNeuronFlow.manage.votingPower.increaseStake"),
            onClick: onClickIncreaseStake,
            outline: true,
          },
        ]}
        value={
          <FormattedVal
            color="palette.text.shade100"
            val={Number(neuron.cached_neuron_stake_e8s.toString())}
            unit={unit}
            showCode
          />
        }
      />
      <ManageModalElementWithAction
        label={`${t("internetComputer.manageNeuronFlow.manage.votingPower.ageBonus")}: +${ageBonus}%`}
        valueTooltip={t("internetComputer.manageNeuronFlow.manage.votingPower.ageBonusTooltip")}
        action={[
          {
            label:
              neuron.dissolveState === "Unlocked"
                ? t("internetComputer.common.disburse")
                : neuron.dissolveState === "Dissolving"
                  ? t("internetComputer.common.stopDissolving")
                  : t("internetComputer.common.startDissolving"),
            onClick:
              neuron.dissolveState === "Unlocked"
                ? onClickDisburseStake
                : onClickStartStopDissolving,
            hidden: !isDeviceControlled,
            outline: true,
          },
        ]}
        value={neuron.dissolveState}
      />
      <ManageModalElementWithAction
        label={`${t("internetComputer.manageNeuronFlow.manage.votingPower.dissolveDelayBonus")}: +${dissolveDelayBonus}%`}
        valueTooltip={t(
          "internetComputer.manageNeuronFlow.manage.votingPower.dissolveDelayBonusTooltip",
        )}
        action={[
          {
            label: `${neuron.dissolveState !== "Unlocked" ? t("common.increase") : t("common.set")} ${t("internetComputer.common.dissolveDelay")}`,
            onClick: onClickSetDissolveDelay,
            hidden: !isDeviceControlled,
            outline: true,
          },
        ]}
        value={`${t("internetComputer.common.dissolveDelay")}: ${neuron.dissolveState === "Unlocked" ? "0" : getNeuronDissolveDuration(neuron)}`}
      />
      <ManageModalElementWithAction
        hidden={votingPower === 0}
        label={
          secondsTillVotingPowerExpires.gt(0)
            ? `${secondsToDurationString(secondsTillVotingPowerExpires.toString())} to confirm following`
            : t("internetComputer.manageNeuronFlow.manage.votingPower.confirmFollowing")
        }
        valueTooltip={t(
          "internetComputer.manageNeuronFlow.manage.votingPower.confirmFollowingTooltip",
        )}
        action={[
          {
            label: t("internetComputer.manageNeuronFlow.manage.votingPower.confirmFollowing"),
            onClick: () => onClickConfirmFollowing(neuron),
            hidden: !isDeviceControlled,
            outline: true,
          },
        ]}
        value={
          secondsTillVotingPowerExpires.gt(0)
            ? t("internetComputer.common.activeNeuron")
            : t("internetComputer.common.inactiveNeuron")
        }
      />
    </ManageModalSection>
  );
}
