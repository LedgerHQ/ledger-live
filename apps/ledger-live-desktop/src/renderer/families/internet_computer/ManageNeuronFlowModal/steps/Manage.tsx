import React, { useCallback } from "react";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import { useDispatch } from "react-redux";
import { StepProps } from "../types";
import { CopiableField } from "../../components/CopialbleField";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import Text from "~/renderer/components/Text";
import { Trans } from "react-i18next";
import { Divider } from "@ledgerhq/react-ui";
import {
  getNeuronDissolveDuration,
  secondsToDurationString,
  getNeuronVotingPower,
  getNeuronAgeBonus,
  getNeuronDissolveDelayBonus,
  getSecondsTillVotingPowerExpires,
  canStakeMaturity,
  canSpawnNeuron,
  canSplitNeuron,
  isDeviceControlledNeuron,
} from "@ledgerhq/live-common/families/internet_computer/utils";
import { closeModal } from "~/renderer/actions/modals";
import { BoxWithBackground } from "../../components/BoxWithBackground";
import Tooltip from "~/renderer/components/Tooltip";
import { StyledIconInfo } from "../../components/StyledIconInfo";
import {
  ManageModalElementWithAction,
  ManageModalElement,
  ManageModalSection,
  ManageModalActionElement,
} from "../../components/ManageModalComponents";
import {
  ICPNeuron,
  InternetComputerOperation,
} from "@ledgerhq/live-common/families/internet_computer/types";
import {
  KNOWN_TOPICS,
  KNOWN_NEURON_IDS,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import WarnBox from "~/renderer/components/WarnBox";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
  padding: "24px",
}))`
  max-width: 800px;
`;

const Section = styled(Box)`
  background: ${p => p.theme.colors.palette.background.paper};
  border-radius: 12px;
  padding: 16px;
  width: 100%;
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
  const { t } = useTranslation();
  const currencyId = account.currency.id;
  const dispatch = useDispatch();
  const unit = account.currency.units[0];
  const neuron = neurons.fullNeurons[manageNeuronIndex];
  const neuronId = neuron.id[0]?.id.toString() ?? "";
  const secondsTillVotingPowerExpires = BigNumber(getSecondsTillVotingPowerExpires(neuron));
  const votingPower = getNeuronVotingPower(neuron);
  const ageBonus = getNeuronAgeBonus(neuron);
  const dissolveDelayBonus = getNeuronDissolveDelayBonus(neuron);
  const isDeviceControlled = isDeviceControlledNeuron(neuron, account.xpub || "");

  const onClickIncreaseStake = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    dispatch(closeModal("MODAL_ICP_LIST_NEURONS"));
    dispatch(
      openModal("MODAL_SEND", {
        stepId: "amount",
        onConfirmationHandler: (optimisticOperation: InternetComputerOperation) => {
          dispatch(
            updateAccountWithUpdater(account.id, account => {
              if (optimisticOperation.type !== "NONE") {
                account = addPendingOperation(account, optimisticOperation);
              }
              return account;
            }),
          );
          dispatch(
            openModal("MODAL_ICP_LIST_NEURONS", {
              account,
              lastManageAction: "increase_stake",
              neuronIndex: manageNeuronIndex,
              stepId: "confirmation",
            }),
          );
        },
        account,
        transaction: {
          ...initTx,
          neuronAccountIdentifier: neuron.accountIdentifier,
          neuronId: neuron.id[0]?.id.toString(),
          type: "increase_stake",
        },
      }),
    );
  }, [account, dispatch, openModal, neuron, manageNeuronIndex]);

  const onClickDisburseStake = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        amount: new BigNumber(neuron.cached_neuron_stake_e8s.toString()),
        type: "disburse",
      }),
    );
    setLastManageAction("disburse");
    transitionTo("manageAction");
  }, [account, onChangeTransaction, transitionTo, neuron, setLastManageAction]);

  const onClickConfirmFollowing = useCallback(
    (neuron: ICPNeuron) => {
      if (account.type !== "Account") return;
      const bridge = getAccountBridge(account, undefined);
      const initTx = bridge.createTransaction(account);
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          type: "refresh_voting_power",
          neuronId: neuron.id[0]?.id.toString(),
        }),
      );
      setLastManageAction("refresh_voting_power");
      transitionTo("manageAction");
    },
    [account, onChangeTransaction, transitionTo, setLastManageAction],
  );

  const onClickStartStopDissolving = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    const action = neuron.dissolveState === "Dissolving" ? "stop_dissolving" : "start_dissolving";
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: action,
      }),
    );
    setLastManageAction(action);
    transitionTo("manageAction");
  }, [account, onChangeTransaction, transitionTo, neuron, setLastManageAction]);

  const onClickAutoStakeMaturity = useCallback(
    (enabled: boolean) => {
      const bridge = getAccountBridge(account, undefined);
      const initTx = bridge.createTransaction(account);
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          neuronId: neuron.id[0]?.id.toString(),
          type: "auto_stake_maturity",
          autoStakeMaturity: enabled,
        }),
      );
      setLastManageAction("auto_stake_maturity");
      transitionTo("manageAction");
    },
    [account, onChangeTransaction, transitionTo, neuron, setLastManageAction],
  );

  const onClickFollow = useCallback(() => {
    transitionTo("followTopic");
  }, [transitionTo]);

  const onClickSplitNeuron = useCallback(() => {
    const action = "split_neuron";
    setLastManageAction(action);
    transitionTo("splitNeuron");
  }, [transitionTo, setLastManageAction]);

  const onClickAddHotKey = useCallback(() => {
    const action = "add_hot_key";
    setLastManageAction(action);
    transitionTo("addHotKey");
  }, [transitionTo, setLastManageAction]);

  const onClickRemoveHotKey = useCallback(
    (hotKey: string) => {
      const bridge = getAccountBridge(account, undefined);
      const initTx = bridge.createTransaction(account);
      const action = "remove_hot_key";
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          type: action,
          neuronId: neuron.id[0]?.id.toString(),
          hotKeyToRemove: hotKey,
        }),
      );
      setLastManageAction(action);
      transitionTo("manageAction");
    },
    [account, onChangeTransaction, transitionTo, neuron, setLastManageAction],
  );

  const onClickSpawnNeuron = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: "spawn_neuron",
      }),
    );
    setLastManageAction("spawn_neuron");
    transitionTo("manageAction");
  }, [account, onChangeTransaction, transitionTo, neuron, setLastManageAction]);

  if (neuron) {
    return (
      <Container>
        <TrackPage
          category="Manage Neurons ICP Flow"
          name="Step Manage"
          flow="stake"
          action="manageNeuron"
          currency={currencyId}
        />

        {/* Header Section */}
        <Section>
          <Box style={{ alignItems: "center" }}>
            <Box alignItems="center" mb={2}>
              <Text ff="Inter|SemiBold" fontSize={8}>
                <FormattedVal val={Number(neuron.cached_neuron_stake_e8s)} unit={unit} showCode />
              </Text>
              {!isDeviceControlled && (
                <BoxWithBackground>
                  <Box horizontal alignItems="center">
                    <Text ff="Inter|Bold" fontSize={3} mr={1} color="palette.text.shade60">
                      <Trans i18nKey="internetComputer.manageNeuronFlow.manage.header.hotkeyControl" />
                    </Text>
                    <Tooltip
                      content={t(
                        "internetComputer.manageNeuronFlow.manage.header.hotkeyControlDescription",
                      )}
                    >
                      <StyledIconInfo size={14} />
                    </Tooltip>
                  </Box>
                </BoxWithBackground>
              )}
            </Box>
            <Box horizontal alignItems="center">
              <Text ff="Inter|Regular" fontSize={3} color="palette.text.shade60" mr={2}>
                <Trans i18nKey="internetComputer.common.neuronId" />:
              </Text>
              <CopiableField value={neuronId}>
                <Text ff="Inter|SemiBold" fontSize={4}>
                  {neuronId}
                </Text>
              </CopiableField>
            </Box>
            <Box horizontal alignItems="center">
              <Text ff="Inter|Regular" fontSize={3} color="palette.text.shade60" mr={2}>
                <Trans i18nKey="internetComputer.manageNeuronFlow.manage.header.votingPower" />:
              </Text>
              <Text ff="Inter|SemiBold" fontSize={4}>
                {votingPower > 0 ? (
                  <FormattedVal val={votingPower} unit={unit} color="palette.text.shade100" />
                ) : (
                  <Trans i18nKey="internetComputer.manageNeuronFlow.manage.header.noVotingPower" />
                )}
              </Text>
            </Box>
          </Box>
        </Section>

        <Divider my={6} width={"100%"} />

        {/* Voting Power Section */}
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
                onClick: () => transitionTo("setDissolveDelay"),
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

        <Divider my={6} width={"100%"} />

        {/* Maturity Section */}
        <ManageModalSection
          title={t("internetComputer.manageNeuronFlow.manage.maturity.title")}
          description={t("internetComputer.manageNeuronFlow.manage.maturity.description")}
          value={
            <FormattedVal
              color="palette.text.shade100"
              val={
                Number(neuron.staked_maturity_e8s_equivalent) +
                Number(neuron.maturity_e8s_equivalent)
              }
              unit={unit}
            />
          }
        >
          <ManageModalElementWithAction
            label={t("internetComputer.manageNeuronFlow.manage.maturity.staked")}
            labelTooltip={t("internetComputer.manageNeuronFlow.manage.maturity.stakedTooltip")}
            value={
              <FormattedVal
                color="palette.text.shade100"
                val={Number(neuron.staked_maturity_e8s_equivalent)}
                unit={unit}
              />
            }
          />
          <ManageModalElementWithAction
            label={t("internetComputer.manageNeuronFlow.manage.maturity.available")}
            labelTooltip={t("internetComputer.manageNeuronFlow.manage.maturity.availableTooltip")}
            action={[
              {
                label: t("internetComputer.manageNeuronFlow.manage.maturity.stakeAction"),
                onClick: () => transitionTo("stakeMaturity"),
                hidden: !isDeviceControlled,
                disabled: !canStakeMaturity(neuron),
                outline: canStakeMaturity(neuron),
              },
              {
                label: t("internetComputer.manageNeuronFlow.manage.maturity.spawnNeuronAction"),
                onClick: onClickSpawnNeuron,
                hidden: !isDeviceControlled,
                disabled: !canSpawnNeuron(neuron),
                outline: canSpawnNeuron(neuron),
              },
            ]}
            value={
              <FormattedVal
                color="palette.text.shade100"
                val={Number(neuron.maturity_e8s_equivalent)}
                unit={unit}
              />
            }
          />
        </ManageModalSection>

        <Divider />

        <Divider my={6} width={"100%"} />

        {/* HotKeys Section */}
        <ManageModalSection title={t("internetComputer.manageNeuronFlow.manage.hotKeys.title")}>
          {neuron.hot_keys.map((val, index) => {
            return (
              <ManageModalElementWithAction
                key={index}
                label={val.toString()}
                copiableLabel
                action={[
                  {
                    label: t("internetComputer.manageNeuronFlow.manage.hotKeys.removeAction"),
                    onClick: () => onClickRemoveHotKey(val.toString()),
                    hidden: !isDeviceControlled,
                    outline: true,
                  },
                ]}
              />
            );
          })}
          {neuron.hot_keys.length === 0 && (
            <ManageModalElement
              label={t("internetComputer.manageNeuronFlow.manage.hotKeys.noHotKeys")}
            />
          )}
          <ManageModalActionElement
            hidden={!isDeviceControlled}
            label={t("internetComputer.manageNeuronFlow.manage.hotKeys.addHotKey")}
            onClick={onClickAddHotKey}
          />
        </ManageModalSection>

        <Divider />
        <Divider my={6} width={"100%"} />

        {/* Advanced Details Section */}
        <ManageModalSection
          title={t("internetComputer.manageNeuronFlow.manage.advancedDetails.title")}
        >
          <ManageModalElement
            label={t("internetComputer.common.neuronId")}
            copiableValue
            value={neuronId}
          />
          <ManageModalElement
            label={t("internetComputer.manageNeuronFlow.manage.advancedDetails.dateCreated")}
            value={new Date(Number(neuron.created_timestamp_seconds) * 1000).toLocaleString(
              "en-US",
              {
                dateStyle: "medium",
                timeStyle: "short",
              },
            )}
          />
          <ManageModalElement
            label={t("internetComputer.manageNeuronFlow.manage.advancedDetails.dissolveDate")}
            value={new Date(Number(neuron.whenDissolvedTimestampSeconds) * 1000).toLocaleString(
              "en-US",
              {
                dateStyle: "medium",
                timeStyle: "short",
              },
            )}
          />
          <ManageModalElement
            label={t("internetComputer.manageNeuronFlow.manage.advancedDetails.neuronAccount")}
            value={neuron.accountIdentifier}
            copiableValue
            ellipsis
          />

          <ManageModalActionElement
            hidden={!isDeviceControlled}
            disabled={!canSplitNeuron(neuron)}
            label={t("internetComputer.manageNeuronFlow.manage.advancedDetails.splitNeuronAction")}
            onClick={onClickSplitNeuron}
          />

          <ManageModalActionElement
            label={`${neuron.auto_stake_maturity[0] ? t("common.stop") : t("common.start")} ${t("internetComputer.manageNeuronFlow.manage.advancedDetails.autoStakeMaturityAction")}`}
            onClick={() => onClickAutoStakeMaturity(!neuron.auto_stake_maturity[0])}
            hidden={!isDeviceControlled}
          />
        </ManageModalSection>

        <Divider />
        <Divider my={6} width={"100%"} />

        {/* Following Section */}
        {neuron.followees.length === 0 && (
          <WarnBox>
            <Trans i18nKey="internetComputer.manageNeuronFlow.manage.following.warnbox" />
          </WarnBox>
        )}
        <ManageModalSection
          title={t("internetComputer.manageNeuronFlow.manage.following.title")}
          titleTooltip={t("internetComputer.manageNeuronFlow.manage.following.description")}
        >
          {Object.entries(neuron.modFollowees).map(([neuronId, topics]) => {
            return (
              <ManageModalElement
                key={`followees-${neuronId}`}
                value={`${topics
                  .map(topic =>
                    KNOWN_TOPICS[topic]
                      ? t(`internetComputer.manageNeuron.followTopic.${topic}.title`)
                      : topic,
                  )
                  .join(", ")}`}
                copiableLabel
                label={KNOWN_NEURON_IDS[neuronId] ?? neuronId}
              />
            );
          })}
          <ManageModalActionElement
            label={t("internetComputer.manageNeuronFlow.manage.following.followNeuronsAction")}
            onClick={onClickFollow}
          />
        </ManageModalSection>
      </Container>
    );
  }
  return null;
}
