import {
  ICP_FEES,
  KNOWN_TOPICS,
  NNS_CLEAR_FOLLOWING_AFTER_SECONDS,
  NNS_MAXIMUM_DISSOLVE_DELAY,
} from "@ledgerhq/live-common/families/internet_computer/consts";
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
  neuronCanVote,
  neuronDecidingVotingPower,
  neuronStake,
} from "@ledgerhq/live-common/families/internet_computer/neuron";
import {
  getNeuronState,
  useCanTopUpNeuron,
  useICPPrincipal,
} from "@ledgerhq/live-common/families/internet_computer/react";
import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
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
  resetAttempt,
  setSelectedNeuronId,
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
    resetAttempt,
  });
  const canTopUp = useCanTopUpNeuron(account, neuron);

  // Clears the stale id on the way out, so the step cannot be re-entered on a neuron that is gone.
  const backToList = useCallback(() => {
    setSelectedNeuronId(null);
    transitionTo("listNeuron");
  }, [setSelectedNeuronId, transitionTo]);

  // Disburse and a refresh both drop a neuron from the snapshot while this step may still name it.
  // Rendering nothing left the stepper sitting on an empty Manage body with no way to read what had
  // happened, so say so and offer the list.
  if (!neuron) {
    return (
      <Box flow={3} px={4} alignItems="center">
        <Text ff="Inter|Regular" fontSize={4} color="neutral.c70">
          <Trans i18nKey="internetComputer.manageNeuronFlow.manage.missingNeuron" />
        </Text>
        <Button primary onClick={backToList} data-testid="icp-manage-missing-back-button">
          <Trans i18nKey="internetComputer.manageNeuronFlow.confirmation.backToNeurons" />
        </Button>
      </Box>
    );
  }

  const permissions = getNeuronActionPermissions(neuron);
  const isControlled = isDeviceControlledNeuron(neuron, principal);
  const votingPower = neuronDecidingVotingPower(neuron);
  const dissolveDelay = getNeuronDissolveDurationSeconds(neuron);
  const secondsTillExpiry = neuronCanVote(neuron)
    ? getSecondsTillVotingPowerExpires(neuron)
    : undefined;
  const maturity = neuron.maturityE8sEquivalent + neuron.stakedMaturityE8sEquivalent;
  const followedTopics = neuron.followees.length;

  // Anything that moves the stake needs the controller.
  const controlledActions = (available: boolean, action: () => void, label: string) =>
    isControlled && available ? [{ label, onClick: action }] : [];

  // Full power for six months, then a month of linear decay, then power and following are both gone.
  // getSecondsTillVotingPowerExpires counts to that last moment, so a remainder inside the
  // clear-following window means decay has already begun.
  const votingPowerCountdown = (remaining: number) => {
    if (remaining <= 0) {
      return t("internetComputer.manageNeuronFlow.manage.votingPower.expired");
    }
    if (remaining <= NNS_CLEAR_FOLLOWING_AFTER_SECONDS) {
      return t("internetComputer.manageNeuronFlow.manage.votingPower.decaying", {
        duration: formatDuration(remaining),
      });
    }
    return t("internetComputer.manageNeuronFlow.manage.votingPower.decayStartsIn", {
      duration: formatDuration(remaining - NNS_CLEAR_FOLLOWING_AFTER_SECONDS),
    });
  };

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
        {/* This row and the next are the base the bonuses below multiply. The row used to show the
            cached stake, which is neither the neuron's own figure above (fees are deducted from it)
            nor the base voting power is computed from (staked maturity is added to it). */}
        <NeuronDetailRow
          label={t("internetComputer.manageNeuronFlow.manage.votingPower.staked")}
          value={
            <FormattedVal
              val={toBigNumber(neuronStake(neuron))}
              unit={unit}
              showCode
              disableRounding
            />
          }
          actions={
            // A top-up is a ledger transfer with no minimum, so the only bound is covering the fee.
            // Without spendable ICP every amount comes back as NotEnoughBalance, which makes the
            // whole flow a dead end rather than a correctable mistake. The same is true without a
            // recoverable stake nonce, which the transfer has to reuse and only this account's own
            // history holds.
            isControlled && canTopUp && account.spendableBalance.gt(ICP_FEES)
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
        <NeuronDetailRow
          label={t("internetComputer.manageNeuronFlow.manage.maturity.staked")}
          tooltip={t("internetComputer.manageNeuronFlow.manage.maturity.stakedTooltip")}
          value={
            <FormattedVal
              val={toBigNumber(neuron.stakedMaturityE8sEquivalent)}
              unit={unit}
              showCode
              disableRounding
            />
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
            // At the maximum there is no legal entry left: the bridge rejects any addition that
            // would overshoot, so offering the flow only leads to an unavoidable error.
            dissolveDelay < BigInt(NNS_MAXIMUM_DISSOLVE_DELAY),
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
            label={votingPowerCountdown(secondsTillExpiry)}
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
        {/* Rendered even at zero: the section total is the two maturities added together, so hiding
            a component leaves a heading nobody can reconcile against its rows. */}
        <NeuronDetailRow
          label={t("internetComputer.manageNeuronFlow.manage.maturity.staked")}
          tooltip={t("internetComputer.manageNeuronFlow.manage.maturity.stakedTooltip")}
          value={
            <FormattedVal
              val={toBigNumber(neuron.stakedMaturityE8sEquivalent)}
              unit={unit}
              disableRounding
            />
          }
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
