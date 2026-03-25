import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import {
  canSpawnNeuron,
  canSplitNeuron,
  canStakeMaturity,
  getNeuronActionPermissions,
  getNeuronAgeBonus,
  getNeuronDissolveDelayBonus,
  getNeuronDissolveDuration,
  getNeuronVotingPower,
  votingPowerNeedsRefresh,
} from "@ledgerhq/live-common/families/internet_computer/utils";
import { Icons } from "@ledgerhq/native-ui";
import { Unit } from "@ledgerhq/types-cryptoassets";
import Clipboard from "@react-native-clipboard/clipboard";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity } from "react-native";
import Circle from "~/components/Circle";
import type { IconProps } from "~/components/DelegationDrawer";
import DelegationDrawer from "~/components/DelegationDrawer";
import LText from "~/components/LText";
import Clock from "~/icons/Clock";
import Coins from "~/icons/Coins";
import Pause from "~/icons/Pause";
import Plus from "~/icons/Plus";
import UndelegateIcon from "~/icons/Undelegate";
import Vote from "~/icons/Vote";
import Withdraw from "~/icons/Withdraw";
import { rgba } from "../../../colors";
import type { NeuronActionType } from "../NeuronManageFlow/types";
import { getNeuronStateDisplay } from "../utils";

type DelegationDrawerProps = React.ComponentProps<typeof DelegationDrawer>;
type DelegationDrawerActions = DelegationDrawerProps["actions"];

const formatAddress = (address: string, startChars = 6, endChars = 6) => {
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

type UseNeuronDrawerDataProps = {
  neuron: ICPNeuron | null;
  unit: Unit;
};

type UseNeuronDrawerDataReturn = {
  drawerData: DelegationDrawerProps["data"];
  copiedNeuronId: boolean;
  resetCopiedState: () => void;
};

export function useNeuronDrawerData({
  neuron,
  unit,
}: UseNeuronDrawerDataProps): UseNeuronDrawerDataReturn {
  const { t } = useTranslation();
  const [copiedNeuronId, setCopiedNeuronId] = useState(false);

  const handleCopyToClipboard = useCallback((text: string) => {
    Clipboard.setString(text);
    setCopiedNeuronId(true);
    setTimeout(() => setCopiedNeuronId(false), 1500);
  }, []);

  const resetCopiedState = useCallback(() => {
    setCopiedNeuronId(false);
  }, []);

  const drawerData = useMemo<DelegationDrawerProps["data"]>(() => {
    if (!neuron) return [];

    const neuronId = neuron.id?.[0]?.id?.toString() || "-";
    const maturity = new BigNumber(neuron.maturity_e8s_equivalent?.toString() || "0");
    const stakedMaturity = new BigNumber(neuron.staked_maturity_e8s_equivalent?.toString() || "0");
    const { label: stateLabel, color: stateColor } = getNeuronStateDisplay(neuron);

    // Get dissolve delay duration (time) - only show for non-unlocked neurons
    const dissolveDelayDuration =
      neuron.dissolveState === "Unlocked" ? "0" : getNeuronDissolveDuration(neuron);

    // Calculate voting power and bonuses
    const votingPower = getNeuronVotingPower(neuron);
    const ageBonus = getNeuronAgeBonus(neuron);
    const dissolveDelayBonus = getNeuronDissolveDelayBonus(neuron);

    // Format dates
    const createdDate = neuron.created_timestamp_seconds
      ? new Date(Number(neuron.created_timestamp_seconds) * 1000).toLocaleDateString("en-US", {
          dateStyle: "medium",
        })
      : "-";

    const dissolveDate = neuron.whenDissolvedTimestampSeconds
      ? new Date(Number(neuron.whenDissolvedTimestampSeconds) * 1000).toLocaleDateString("en-US", {
          dateStyle: "medium",
        })
      : "-";

    return [
      {
        label: t("icp.staking.drawer.neuronId"),
        Component: (
          <TouchableOpacity
            style={styles.copyRow}
            onPress={() => handleCopyToClipboard(neuronId)}
            activeOpacity={0.7}
          >
            <LText
              numberOfLines={1}
              semiBold
              ellipsizeMode="middle"
              style={[styles.valueText, styles.flexText]}
            >
              {neuronId}
            </LText>
            {copiedNeuronId ? (
              <Icons.Check size="S" color="success.c50" />
            ) : (
              <Icons.Copy size="S" color="neutral.c70" />
            )}
          </TouchableOpacity>
        ),
      },
      {
        label: t("icp.staking.drawer.status"),
        Component: (
          <LText numberOfLines={1} semiBold style={styles.valueText} color={stateColor}>
            {stateLabel}
          </LText>
        ),
      },
      {
        label: t("icp.staking.drawer.dissolveDelay"),
        Component: (
          <LText numberOfLines={1} semiBold style={styles.valueText}>
            {dissolveDelayDuration}
          </LText>
        ),
      },
      {
        label: t("icp.staking.drawer.dissolveDelayBonus"),
        Component: (
          <LText numberOfLines={1} semiBold style={styles.valueText}>
            +{dissolveDelayBonus}%
          </LText>
        ),
      },
      {
        label: t("icp.staking.drawer.ageBonus"),
        Component: (
          <LText numberOfLines={1} semiBold style={styles.valueText}>
            +{ageBonus}%
          </LText>
        ),
      },
      {
        label: t("icp.staking.drawer.votingPower"),
        Component: (
          <LText numberOfLines={1} semiBold style={styles.valueText}>
            {votingPower > 0
              ? formatCurrencyUnit(unit, new BigNumber(votingPower), { showCode: true })
              : "-"}
          </LText>
        ),
      },
      {
        label: t("icp.staking.drawer.maturity"),
        Component: (
          <LText numberOfLines={1} semiBold style={styles.valueText}>
            {formatCurrencyUnit(unit, maturity, { showCode: true })}
          </LText>
        ),
      },
      {
        label: t("icp.staking.drawer.stakedMaturity"),
        Component: (
          <LText numberOfLines={1} semiBold style={styles.valueText}>
            {formatCurrencyUnit(unit, stakedMaturity, { showCode: true })}
          </LText>
        ),
      },
      {
        label: t("icp.staking.drawer.dateCreated"),
        Component: (
          <LText numberOfLines={1} semiBold style={styles.valueText}>
            {createdDate}
          </LText>
        ),
      },
      {
        label: t("icp.staking.drawer.dissolveDate"),
        Component: (
          <LText numberOfLines={1} semiBold style={styles.valueText}>
            {dissolveDate}
          </LText>
        ),
      },
      {
        label: t("icp.staking.drawer.neuronAccount"),
        Component: (
          <TouchableOpacity
            style={styles.copyRow}
            onPress={() => handleCopyToClipboard(neuron.accountIdentifier || "")}
            activeOpacity={0.7}
          >
            <LText
              numberOfLines={1}
              semiBold
              ellipsizeMode="middle"
              style={[styles.valueText, styles.flexText]}
            >
              {formatAddress(neuron.accountIdentifier || "-", 8, 8)}
            </LText>
            <Icons.Copy size="S" color="neutral.c70" />
          </TouchableOpacity>
        ),
      },
      {
        label: t("icp.staking.drawer.followees"),
        Component: (
          <LText numberOfLines={1} semiBold style={styles.valueText}>
            {Object.keys(neuron.modFollowees || {}).length}
          </LText>
        ),
      },
      {
        label: t("icp.staking.drawer.hotKeys"),
        Component: (
          <LText numberOfLines={1} semiBold style={styles.valueText}>
            {neuron.hot_keys?.length ?? 0}
          </LText>
        ),
      },
    ];
  }, [neuron, t, unit, copiedNeuronId, handleCopyToClipboard]);

  return { drawerData, copiedNeuronId, resetCopiedState };
}

type NeuronActionParams = {
  autoStakeMaturity?: boolean;
};

type UseNeuronDrawerActionsProps = {
  neuron: ICPNeuron | null;
  onNeuronAction: (actionType: NeuronActionType, params?: NeuronActionParams) => void;
};

export function useNeuronDrawerActions({
  neuron,
  onNeuronAction,
}: UseNeuronDrawerActionsProps): DelegationDrawerActions {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return useMemo<DelegationDrawerActions>(() => {
    if (!neuron) return [];

    const { canDisburse, canStartDissolving, canStopDissolving } =
      getNeuronActionPermissions(neuron);

    // Use utility functions from ledger-live-icp for proper validation
    const canSplit = canSplitNeuron(neuron);
    const canStake = canStakeMaturity(neuron);
    const canSpawn = canSpawnNeuron(neuron);

    const hasHotKeys = neuron.hot_keys && neuron.hot_keys.length > 0;
    const iconSize = 24;

    // Calculate voting power - only show refresh action if neuron has voting power (same as desktop)
    const votingPower = getNeuronVotingPower(neuron);
    const hasVotingPower = votingPower > 0;

    // Check if neuron needs to refresh voting power (same logic as getBannerState "confirmFollowing")
    const { needsRefresh: needsRefreshVotingPower } = votingPowerNeedsRefresh([neuron]);

    const actionsList: DelegationDrawerActions = [];

    // If voting power needs refresh and neuron has voting power, add it first with warning color
    if (needsRefreshVotingPower && hasVotingPower) {
      actionsList.push({
        label: t("icp.neuronManage.actions.refreshVotingPower"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.notification, 0.2)}>
            <Vote size={iconSize} color={colors.notification} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("refresh_voting_power"),
        event: "ICPNeuronActionRefreshVotingPower",
      });
    }

    actionsList.push({
      label: t("icp.neuronManage.actions.increaseStake"),
      Icon: (props: IconProps) => (
        <Circle {...props} bg={rgba(colors.primary, 0.2)}>
          <Plus size={iconSize} color={colors.primary} />
        </Circle>
      ),
      disabled: false,
      onPress: () => onNeuronAction("increase_stake"),
      event: "ICPNeuronActionIncreaseStake",
    });

    if (canStartDissolving) {
      actionsList.push({
        label: t("icp.neuronManage.actions.startDissolving"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <Clock size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("start_dissolving"),
        event: "ICPNeuronActionStartDissolving",
      });
    }

    if (canStopDissolving) {
      actionsList.push({
        label: t("icp.neuronManage.actions.stopDissolving"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <Pause size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("stop_dissolving"),
        event: "ICPNeuronActionStopDissolving",
      });
    }

    // Set/Increase Dissolve Delay - always available
    // Label changes based on state: "Set" for Unlocked, "Increase" for Locked/Dissolving
    const dissolveDelayLabel =
      neuron.dissolveState === "Unlocked"
        ? t("icp.neuronManage.actions.setDissolveDelay")
        : t("icp.neuronManage.actions.increaseDissolveDelay");

    actionsList.push({
      label: dissolveDelayLabel,
      Icon: (props: IconProps) => (
        <Circle {...props} bg={rgba(colors.primary, 0.2)}>
          <Clock size={iconSize} color={colors.primary} />
        </Circle>
      ),
      disabled: false,
      onPress: () => onNeuronAction("set_dissolve_delay"),
      event: "ICPNeuronActionSetDissolveDelay",
    });

    actionsList.push({
      label: t("icp.neuronManage.actions.follow"),
      Icon: (props: IconProps) => (
        <Circle {...props} bg={rgba(colors.primary, 0.2)}>
          <Vote size={iconSize} color={colors.primary} />
        </Circle>
      ),
      disabled: false,
      onPress: () => onNeuronAction("follow"),
      event: "ICPNeuronActionFollow",
    });

    if (canDisburse) {
      actionsList.push({
        label: t("icp.neuronManage.actions.disburse"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.green, 0.2)}>
            <Withdraw size={iconSize} color={colors.green} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("disburse"),
        event: "ICPNeuronActionDisburse",
      });
    }

    if (canSplit) {
      actionsList.push({
        label: t("icp.neuronManage.actions.splitNeuron"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <UndelegateIcon size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("split_neuron"),
        event: "ICPNeuronActionSplitNeuron",
      });
    }

    if (canStake) {
      actionsList.push({
        label: t("icp.neuronManage.actions.stakeMaturity"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <Coins size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("stake_maturity"),
        event: "ICPNeuronActionStakeMaturity",
      });
    }

    if (canSpawn) {
      actionsList.push({
        label: t("icp.neuronManage.actions.spawnNeuron"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <Plus size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("spawn_neuron"),
        event: "ICPNeuronActionSpawnNeuron",
      });
    }

    actionsList.push({
      label: t("icp.neuronManage.actions.addHotKey"),
      Icon: (props: IconProps) => (
        <Circle {...props} bg={rgba(colors.primary, 0.2)}>
          <Plus size={iconSize} color={colors.primary} />
        </Circle>
      ),
      disabled: false,
      onPress: () => onNeuronAction("add_hot_key"),
      event: "ICPNeuronActionAddHotKey",
    });

    if (hasHotKeys) {
      actionsList.push({
        label: t("icp.neuronManage.actions.removeHotKey"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <UndelegateIcon size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("remove_hot_key"),
        event: "ICPNeuronActionRemoveHotKey",
      });
    }

    // Auto Stake Maturity - label changes based on current state
    const isAutoStakeEnabled = neuron.auto_stake_maturity?.[0] ?? false;
    actionsList.push({
      label: isAutoStakeEnabled
        ? t("icp.neuronManage.actions.stopAutoStakeMaturity")
        : t("icp.neuronManage.actions.startAutoStakeMaturity"),
      Icon: (props: IconProps) => (
        <Circle {...props} bg={rgba(colors.primary, 0.2)}>
          <Coins size={iconSize} color={colors.primary} />
        </Circle>
      ),
      disabled: false,
      onPress: () =>
        onNeuronAction("auto_stake_maturity", { autoStakeMaturity: !isAutoStakeEnabled }),
      event: "ICPNeuronActionAutoStakeMaturity",
    });

    // Only show refresh voting power at the bottom if neuron has voting power and it's not already at the top
    if (hasVotingPower && !needsRefreshVotingPower) {
      actionsList.push({
        label: t("icp.neuronManage.actions.refreshVotingPower"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <Vote size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("refresh_voting_power"),
        event: "ICPNeuronActionRefreshVotingPower",
      });
    }

    return actionsList;
  }, [neuron, t, onNeuronAction, colors.primary, colors.green, colors.notification]);
}

const styles = StyleSheet.create({
  valueText: {
    fontSize: 14,
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  flexText: {
    flex: 1,
  },
});
