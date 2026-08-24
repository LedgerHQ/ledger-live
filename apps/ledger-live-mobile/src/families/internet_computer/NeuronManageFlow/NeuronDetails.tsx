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
  neuronPotentialVotingPower,
  neuronStake,
} from "@ledgerhq/live-common/families/internet_computer/neuron";
import {
  getNeuronState,
  useICPNeuronById,
  useICPPrincipal,
} from "@ledgerhq/live-common/families/internet_computer/react";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { Flex, ScrollContainer, Text } from "@ledgerhq/native-ui";
import invariant from "invariant";
import React, { useCallback } from "react";
import { TrackScreen } from "~/analytics";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import SafeAreaView from "~/components/SafeAreaView";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { toBigNumber } from "../amounts";
import { NeuronDetailRow, NeuronSection } from "../components/NeuronDetails";
import { useFormatDuration } from "../useFormatDuration";
import { useNeuronActions, type NeuronScreen } from "./useNeuronActions";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = StackNavigatorProps<
  InternetComputerNeuronManageFlowParamList,
  ScreenName.InternetComputerNeuronDetails
>;

// Percentage above the 1x base, as the bonus is presented to the user.
const bonusPercent = (multiplier: number) => Math.round((multiplier - 1) * 100);

// Following and periodic confirmation are voting actions, which the canister authorizes for hot keys
// as well as the controller (governance.rs: `follow` and `refresh_voting_power` both gate on
// `is_authorized_to_vote`). Gating these on the controller would lock a hot-key holder out of the
// only two things a hot key is for.
const voting = (onPress: () => void, label: string) => [{ label, onPress }];

const topicName = (topic: number) =>
  Object.keys(KNOWN_TOPICS).find(
    name => KNOWN_TOPICS[name as keyof typeof KNOWN_TOPICS] === topic,
  ) ?? String(topic);

export default function NeuronDetails({ navigation, route }: Props) {
  const { t } = useTranslation();
  const formatDuration = useFormatDuration();
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "internet_computer account required");

  const icpAccount = account as ICPAccount;
  const unit = useAccountUnit(icpAccount);
  const principal = useICPPrincipal(icpAccount);
  const neuron = useICPNeuronById(icpAccount, route.params.neuronId);

  // `navigate` is overloaded per screen against a param list this callback is deliberately generic
  // over, so no overload matches; useNeuronActions supplies params matching the screen it picks.
  const navigate = useCallback(
    (screen: NeuronScreen, params: Record<string, unknown>) =>
      (
        navigation as unknown as {
          navigate: (screen: NeuronScreen, params: Record<string, unknown>) => void;
        }
      ).navigate(screen, { ...route.params, ...params }),
    [navigation, route.params],
  );

  const actions = useNeuronActions({ account: icpAccount, neuron, navigate });

  if (!neuron) return null;

  const permissions = getNeuronActionPermissions(neuron);
  const isControlled = isDeviceControlledNeuron(neuron, principal);
  const votingPower = neuronPotentialVotingPower(neuron);
  const dissolveDelay = getNeuronDissolveDurationSeconds(neuron);
  const secondsTillExpiry = getSecondsTillVotingPowerExpires(neuron);
  const maturity = neuron.maturityE8sEquivalent + neuron.stakedMaturityE8sEquivalent;

  // Anything that moves the stake needs the controller.
  const controlled = (available: boolean, onPress: () => void, label: string) =>
    isControlled && available ? [{ label, onPress }] : [];

  const canSplit = isControlled && neuronCanBeSplit(neuron, BigInt(ICP_FEES));

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
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen
        category="Manage Neurons ICP Flow"
        name="NeuronDetails"
        flow="stake"
        action="manageNeuron"
        currency={icpAccount.currency.id}
      />
      <ScrollContainer contentContainerStyle={{ padding: 16 }}>
        <NeuronSection
          title={t("internetComputer.manageNeuronFlow.manage.neuron", {
            neuronId: neuron.id?.toString() ?? "",
          })}
          value={
            <CurrencyUnitValue
              disableRounding
              showCode
              unit={unit}
              value={toBigNumber(neuronStake(neuron))}
            />
          }
        >
          {isControlled ? null : (
            <Text variant="small" color="neutral.c70">
              {t("internetComputer.manageNeuronFlow.manage.hotKeyOnly")}
            </Text>
          )}
        </NeuronSection>

        <NeuronSection
          title={t("internetComputer.manageNeuronFlow.manage.votingPower.title")}
          hint={t("internetComputer.manageNeuronFlow.manage.votingPower.tooltip")}
          value={
            votingPower > 0n ? (
              <CurrencyUnitValue disableRounding unit={unit} value={toBigNumber(votingPower)} />
            ) : (
              t("internetComputer.common.none")
            )
          }
        >
          {/* This row and the next are the base the bonuses below multiply. The row used to show the
              cached stake, which is neither the neuron's own figure above (fees are deducted from it)
              nor the base voting power is computed from (staked maturity is added to it). */}
          <NeuronDetailRow
            label={t("internetComputer.manageNeuronFlow.manage.votingPower.staked")}
            value={
              <CurrencyUnitValue
                disableRounding
                showCode
                unit={unit}
                value={toBigNumber(neuronStake(neuron))}
              />
            }
            actions={
              // A top-up is a ledger transfer with no minimum, so the only bound is covering the fee.
              // Without spendable ICP every amount comes back as NotEnoughBalance, which makes the
              // whole flow a dead end rather than a correctable mistake.
              isControlled && icpAccount.spendableBalance.gt(ICP_FEES)
                ? [
                    {
                      label: t(
                        "internetComputer.manageNeuronFlow.manage.votingPower.increaseStake",
                      ),
                      onPress: actions.onIncreaseStake,
                      testID: "icp-increase-stake-button",
                    },
                  ]
                : []
            }
          />
          <NeuronDetailRow
            label={t("internetComputer.manageNeuronFlow.manage.maturity.staked")}
            hint={t("internetComputer.manageNeuronFlow.manage.maturity.stakedTooltip")}
            value={
              <CurrencyUnitValue
                disableRounding
                showCode
                unit={unit}
                value={toBigNumber(neuron.stakedMaturityE8sEquivalent)}
              />
            }
          />
          <NeuronDetailRow
            label={t("internetComputer.manageNeuronFlow.manage.votingPower.state")}
            value={t(`internetComputer.neuronState.${getNeuronState(neuron)}`)}
            actions={[
              ...controlled(
                permissions.canDisburse,
                actions.onDisburse,
                t("internetComputer.common.disburse"),
              ),
              ...controlled(
                permissions.canStartDissolving,
                actions.onStartStopDissolving,
                t("internetComputer.common.startDissolving"),
              ),
              ...controlled(
                permissions.canStopDissolving,
                actions.onStartStopDissolving,
                t("internetComputer.common.stopDissolving"),
              ),
            ]}
          />
          <NeuronDetailRow
            label={t("internetComputer.manageNeuronFlow.manage.votingPower.ageBonus")}
            hint={t("internetComputer.manageNeuronFlow.manage.votingPower.ageBonusTooltip")}
            value={t("internetComputer.manageNeuronFlow.manage.votingPower.bonusValue", {
              percent: bonusPercent(ageMultiplier(neuron.ageSeconds)),
            })}
          />
          <NeuronDetailRow
            label={t("internetComputer.manageNeuronFlow.manage.votingPower.dissolveDelayBonus", {
              percent: bonusPercent(dissolveDelayMultiplier(neuron.dissolveDelaySeconds)),
            })}
            hint={t(
              "internetComputer.manageNeuronFlow.manage.votingPower.dissolveDelayBonusTooltip",
            )}
            value={
              dissolveDelay > 0n
                ? formatDuration(dissolveDelay)
                : t("internetComputer.manageNeuronFlow.manage.votingPower.noDissolveDelay")
            }
            actions={controlled(
              // At the maximum there is no legal entry left: the bridge rejects any addition that
              // would overshoot, so offering the flow only leads to an unavoidable error.
              dissolveDelay < BigInt(NNS_MAXIMUM_DISSOLVE_DELAY),
              actions.onSetDissolveDelay,
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
              hint={t(
                "internetComputer.manageNeuronFlow.manage.votingPower.confirmFollowingTooltip",
              )}
              actions={voting(
                actions.onConfirmFollowing,
                t("internetComputer.manageNeuronFlow.manage.votingPower.confirmFollowing"),
              )}
            />
          )}
        </NeuronSection>

        <NeuronSection
          title={t("internetComputer.manageNeuronFlow.manage.maturity.title")}
          hint={t("internetComputer.manageNeuronFlow.manage.maturity.tooltip")}
          value={<CurrencyUnitValue disableRounding unit={unit} value={toBigNumber(maturity)} />}
        >
          <NeuronDetailRow
            label={t("internetComputer.manageNeuronFlow.manage.maturity.available")}
            value={
              <CurrencyUnitValue
                disableRounding
                unit={unit}
                value={toBigNumber(neuron.maturityE8sEquivalent)}
              />
            }
            actions={[
              ...controlled(
                hasEnoughMaturityToStake(neuron),
                actions.onStakeMaturity,
                t("internetComputer.manageNeuronFlow.manage.maturity.stake"),
              ),
              ...controlled(
                // Spawning the whole balance is the best case; below that nothing can be spawned.
                isEnoughMaturityToSpawn(neuron, 100),
                actions.onSpawnNeuron,
                t("internetComputer.manageNeuronFlow.manage.maturity.spawn"),
              ),
            ]}
          />
          {/* Rendered even at zero: the section total is the two maturities added together, so hiding
              a component leaves a heading nobody can reconcile against its rows. */}
          <NeuronDetailRow
            label={t("internetComputer.manageNeuronFlow.manage.maturity.staked")}
            hint={t("internetComputer.manageNeuronFlow.manage.maturity.stakedTooltip")}
            value={
              <CurrencyUnitValue
                disableRounding
                unit={unit}
                value={toBigNumber(neuron.stakedMaturityE8sEquivalent)}
              />
            }
          />
          <NeuronDetailRow
            label={t("internetComputer.manageNeuronFlow.manage.maturity.autoStake")}
            hint={t("internetComputer.manageNeuronFlow.manage.maturity.autoStakeTooltip")}
            value={t(
              neuron.autoStakeMaturity
                ? "internetComputer.common.enabled"
                : "internetComputer.common.disabled",
            )}
            actions={controlled(
              true,
              () => actions.onAutoStakeMaturity(!neuron.autoStakeMaturity),
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
          hint={t("internetComputer.manageNeuronFlow.manage.following.tooltip")}
          value={t("internetComputer.manageNeuronFlow.manage.following.count", {
            count: neuron.followees.length,
          })}
        >
          {neuron.followees.map(followee => (
            <NeuronDetailRow
              key={followee.topic}
              label={topicName(followee.topic)}
              value={followee.followeeIds.map(id => id.toString()).join(", ")}
            />
          ))}
          <NeuronDetailRow
            label={t("internetComputer.manageNeuronFlow.manage.following.edit")}
            actions={voting(
              actions.onFollow,
              t("internetComputer.manageNeuronFlow.manage.following.follow"),
            )}
          />
        </NeuronSection>

        <NeuronSection
          title={t("internetComputer.manageNeuronFlow.manage.hotKeys.title")}
          hint={t("internetComputer.manageNeuronFlow.manage.hotKeys.tooltip")}
        >
          {/* The principal is the row's value, not its label: it is the datum, and a hot-key holder
              sees the list without the Remove action a row of pure label would be dropped with. */}
          {neuron.hotKeys.map(hotKey => (
            <NeuronDetailRow
              key={hotKey}
              value={hotKey}
              actions={controlled(
                true,
                () => actions.onRemoveHotKey(hotKey),
                t("internetComputer.manageNeuronFlow.manage.hotKeys.remove"),
              )}
            />
          ))}
          <NeuronDetailRow
            label={t("internetComputer.manageNeuronFlow.manage.hotKeys.add")}
            actions={controlled(
              true,
              actions.onAddHotKey,
              t("internetComputer.manageNeuronFlow.manage.hotKeys.addAction"),
            )}
          />
        </NeuronSection>

        {/* The section holds one action and no data, so without the action there is nothing under the
            heading to read. */}
        {canSplit ? (
          <NeuronSection title={t("internetComputer.manageNeuronFlow.manage.advanced.title")}>
            <NeuronDetailRow
              label={t("internetComputer.manageNeuronFlow.manage.advanced.split")}
              hint={t("internetComputer.manageNeuronFlow.manage.advanced.splitTooltip")}
              actions={[
                {
                  label: t("internetComputer.manageNeuronFlow.manage.advanced.splitAction"),
                  onPress: actions.onSplitNeuron,
                },
              ]}
            />
          </NeuronSection>
        ) : null}
        <Flex height={24} />
      </ScrollContainer>
    </SafeAreaView>
  );
}
