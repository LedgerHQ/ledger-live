import { ICP_FEES, KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import {
  ageMultiplier,
  dissolveDelayMultiplier,
  getNeuronActionPermissions,
  getNeuronDissolveDurationSeconds,
  getSecondsTillVotingPowerExpires,
  hasEnoughMaturityToStake,
  isDeviceControlledNeuron,
  isEnoughMaturityToSpawn,
  isNeuronDissolved,
  neuronCanBeSplit,
  neuronPotentialVotingPower,
  neuronStake,
} from "@ledgerhq/live-common/families/internet_computer/neuron";
import {
  getNeuronState,
  useICPPrincipal,
} from "@ledgerhq/live-common/families/internet_computer/react";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import { NeuronDetailRow, NeuronSection } from "../../components/NeuronDetails";
import { toBigNumber } from "../../amounts";
import { useFormatDuration } from "../../useFormatDuration";
import { useNeuronActions } from "../../neuronFlow/useNeuronActions";
import type { StepProps } from "../../neuronFlow/types";

// Percentage above the 1x base, as the bonus is presented to the user.
const bonusPercent = (multiplier: number) => Math.round((multiplier - 1) * 100);

// Following and periodic confirmation are voting actions, which the canister authorizes for hot keys
// as well as the controller (governance.rs: `follow` and `refresh_voting_power` both gate on
// `is_authorized_to_vote`). Gating these on the controller would lock a hot-key holder out of the
// only two things a hot key is for.
const votingActions = (action: () => void, label: string) => [{ label, onClick: action }];

const StepManage = ({
  account,
  neurons,
  selectedNeuronId,
  onChangeTransaction,
  transitionTo,
  setLastAction,
}: StepProps) => {
  const { t } = useTranslation();
  const formatDuration = useFormatDuration();
  const principal = useICPPrincipal(account);
  const unit = account.currency.units[0];

  const neuron = neurons.find(n => n.id?.toString() === selectedNeuronId);
  const actions = useNeuronActions({
    account,
    // A neuron can disappear between steps if a refresh lands while this step is open, so the hook
    // takes it as optional and the guard below keeps a missing one off the screen.
    neuron,
    onChangeTransaction,
    transitionTo,
    setLastAction,
  });

  if (!neuron) return null;

  const permissions = getNeuronActionPermissions(neuron);
  const isControlled = isDeviceControlledNeuron(neuron, principal);
  const votingPower = neuronPotentialVotingPower(neuron);
  const dissolveDelay = getNeuronDissolveDurationSeconds(neuron);
  const secondsTillExpiry = getSecondsTillVotingPowerExpires(neuron);
  const maturity = neuron.maturityE8sEquivalent + neuron.stakedMaturityE8sEquivalent;
  const followedTopics = neuron.followees.length;

  // Anything that moves the stake needs the controller.
  const controlledActions = (available: boolean, action: () => void, label: string) =>
    isControlled && available ? [{ label, onClick: action }] : [];

  return (
    <Box flow={2} px={4}>
      <TrackPage
        category="Manage Neurons ICP Flow"
        name="Step Manage"
        flow="stake"
        action="manageNeuron"
        currency={account.currency.id}
      />

      <NeuronSection
        title={t("internetComputer.manageNeuronFlow.manage.neuron", {
          neuronId: neuron.id?.toString() ?? "",
        })}
        value={
          <FormattedVal
            val={toBigNumber(neuronStake(neuron))}
            unit={unit}
            showCode
            disableRounding
          />
        }
      >
        {isControlled ? null : (
          <Text ff="Inter|Regular" fontSize={3} color="neutral.c70">
            <Trans i18nKey="internetComputer.manageNeuronFlow.manage.hotKeyOnly" />
          </Text>
        )}
      </NeuronSection>

      <NeuronSection
        title={t("internetComputer.manageNeuronFlow.manage.votingPower.title")}
        tooltip={t("internetComputer.manageNeuronFlow.manage.votingPower.tooltip")}
        value={
          votingPower > 0n ? (
            <FormattedVal val={toBigNumber(votingPower)} unit={unit} disableRounding />
          ) : (
            <Trans i18nKey="internetComputer.common.none" />
          )
        }
      >
        <NeuronDetailRow
          label={t("internetComputer.manageNeuronFlow.manage.votingPower.staked")}
          value={
            <FormattedVal
              val={toBigNumber(neuron.cachedNeuronStakeE8s)}
              unit={unit}
              showCode
              disableRounding
            />
          }
          actions={
            isControlled
              ? [
                  {
                    label: t("internetComputer.manageNeuronFlow.manage.votingPower.increaseStake"),
                    onClick: actions.onClickIncreaseStake,
                    testId: "icp-increase-stake-button",
                  },
                ]
              : []
          }
        />
        {/* State owns the lifecycle actions. It used to share a row with the age bonus, which read
            as though "Locked" were the bonus's value. */}
        <NeuronDetailRow
          label={t("internetComputer.manageNeuronFlow.manage.votingPower.state")}
          value={t(`internetComputer.neuronState.${getNeuronState(neuron)}`)}
          actions={[
            ...controlledActions(
              permissions.canDisburse,
              actions.onClickDisburse,
              t("internetComputer.common.disburse"),
            ),
            ...controlledActions(
              permissions.canStartDissolving,
              actions.onClickStartStopDissolving,
              t("internetComputer.common.startDissolving"),
            ),
            ...controlledActions(
              permissions.canStopDissolving,
              actions.onClickStartStopDissolving,
              t("internetComputer.common.stopDissolving"),
            ),
          ]}
        />
        <NeuronDetailRow
          label={t("internetComputer.manageNeuronFlow.manage.votingPower.ageBonus")}
          tooltip={t("internetComputer.manageNeuronFlow.manage.votingPower.ageBonusTooltip")}
          value={t("internetComputer.manageNeuronFlow.manage.votingPower.bonusValue", {
            percent: bonusPercent(ageMultiplier(neuron.ageSeconds)),
          })}
        />
        <NeuronDetailRow
          label={t("internetComputer.manageNeuronFlow.manage.votingPower.dissolveDelayBonus", {
            percent: bonusPercent(dissolveDelayMultiplier(neuron.dissolveDelaySeconds)),
          })}
          tooltip={t(
            "internetComputer.manageNeuronFlow.manage.votingPower.dissolveDelayBonusTooltip",
          )}
          value={
            dissolveDelay > 0n
              ? formatDuration(dissolveDelay)
              : t("internetComputer.manageNeuronFlow.manage.votingPower.noDissolveDelay")
          }
          actions={controlledActions(
            true,
            actions.onClickSetDissolveDelay,
            // Must agree with the transaction type useNeuronActions picks: only a dissolved neuron
            // sets its delay outright, every other state can only add to it.
            t(
              isNeuronDissolved(neuron)
                ? "internetComputer.manageNeuronFlow.manage.votingPower.setDissolveDelay"
                : "internetComputer.manageNeuronFlow.manage.votingPower.increaseDissolveDelay",
            ),
          )}
        />
        {secondsTillExpiry === undefined ? null : (
          <NeuronDetailRow
            label={
              secondsTillExpiry > 0
                ? t("internetComputer.manageNeuronFlow.manage.votingPower.expiresIn", {
                    duration: formatDuration(secondsTillExpiry),
                  })
                : t("internetComputer.manageNeuronFlow.manage.votingPower.expired")
            }
            tooltip={t(
              "internetComputer.manageNeuronFlow.manage.votingPower.confirmFollowingTooltip",
            )}
            actions={votingActions(
              actions.onClickConfirmFollowing,
              t("internetComputer.manageNeuronFlow.manage.votingPower.confirmFollowing"),
            )}
          />
        )}
      </NeuronSection>

      <NeuronSection
        title={t("internetComputer.manageNeuronFlow.manage.maturity.title")}
        tooltip={t("internetComputer.manageNeuronFlow.manage.maturity.tooltip")}
        value={<FormattedVal val={toBigNumber(maturity)} unit={unit} disableRounding />}
      >
        <NeuronDetailRow
          label={t("internetComputer.manageNeuronFlow.manage.maturity.available")}
          value={
            <FormattedVal
              val={toBigNumber(neuron.maturityE8sEquivalent)}
              unit={unit}
              disableRounding
            />
          }
          actions={[
            ...controlledActions(
              hasEnoughMaturityToStake(neuron),
              actions.onClickStakeMaturity,
              t("internetComputer.manageNeuronFlow.manage.maturity.stake"),
            ),
            ...controlledActions(
              // Spawning the whole balance is the best case; below that nothing can be spawned.
              isEnoughMaturityToSpawn(neuron, 100),
              actions.onClickSpawnNeuron,
              t("internetComputer.manageNeuronFlow.manage.maturity.spawn"),
            ),
          ]}
        />
        <NeuronDetailRow
          label={t("internetComputer.manageNeuronFlow.manage.maturity.autoStake")}
          tooltip={t("internetComputer.manageNeuronFlow.manage.maturity.autoStakeTooltip")}
          value={t(
            neuron.autoStakeMaturity
              ? "internetComputer.common.enabled"
              : "internetComputer.common.disabled",
          )}
          actions={controlledActions(
            true,
            () => actions.onClickAutoStakeMaturity(!neuron.autoStakeMaturity),
            t(
              neuron.autoStakeMaturity
                ? "internetComputer.common.disable"
                : "internetComputer.common.enable",
            ),
          )}
        />
      </NeuronSection>

      <NeuronSection
        title={t("internetComputer.manageNeuronFlow.manage.following.title")}
        tooltip={t("internetComputer.manageNeuronFlow.manage.following.tooltip")}
        value={t("internetComputer.manageNeuronFlow.manage.following.count", {
          count: followedTopics,
        })}
      >
        {neuron.followees.map(followee => (
          <NeuronDetailRow
            key={followee.topic}
            label={
              Object.keys(KNOWN_TOPICS).find(
                name => KNOWN_TOPICS[name as keyof typeof KNOWN_TOPICS] === followee.topic,
              ) ?? String(followee.topic)
            }
            value={followee.followeeIds.map(id => id.toString()).join(", ")}
          />
        ))}
        <NeuronDetailRow
          label={t("internetComputer.manageNeuronFlow.manage.following.edit")}
          actions={votingActions(
            actions.onClickFollow,
            t("internetComputer.manageNeuronFlow.manage.following.follow"),
          )}
        />
      </NeuronSection>

      <NeuronSection
        title={t("internetComputer.manageNeuronFlow.manage.hotKeys.title")}
        tooltip={t("internetComputer.manageNeuronFlow.manage.hotKeys.tooltip")}
      >
        {neuron.hotKeys.map(hotKey => (
          <NeuronDetailRow
            key={hotKey}
            label={hotKey}
            actions={controlledActions(
              true,
              () => actions.onClickRemoveHotKey(hotKey),
              t("internetComputer.manageNeuronFlow.manage.hotKeys.remove"),
            )}
          />
        ))}
        <NeuronDetailRow
          label={t("internetComputer.manageNeuronFlow.manage.hotKeys.add")}
          actions={controlledActions(
            true,
            actions.onClickAddHotKey,
            t("internetComputer.manageNeuronFlow.manage.hotKeys.addAction"),
          )}
        />
      </NeuronSection>

      <NeuronSection title={t("internetComputer.manageNeuronFlow.manage.advanced.title")}>
        <NeuronDetailRow
          label={t("internetComputer.manageNeuronFlow.manage.advanced.split")}
          tooltip={t("internetComputer.manageNeuronFlow.manage.advanced.splitTooltip")}
          actions={controlledActions(
            neuronCanBeSplit(neuron, BigInt(ICP_FEES)),
            actions.onClickSplitNeuron,
            t("internetComputer.manageNeuronFlow.manage.advanced.splitAction"),
          )}
        />
      </NeuronSection>
    </Box>
  );
};

export default StepManage;
