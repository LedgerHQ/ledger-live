import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import BigNumber from "bignumber.js";

import type { StackNavigationProp } from "@react-navigation/stack";
import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { NavigationType } from "../../../../../types";
import type { DrawerPropsType } from "../types";
import type { Action, IconProps } from "~/components/DelegationDrawer";

import Circle from "~/components/Circle";
import ClaimRewardIcon from "~/icons/ClaimReward";
import UndelegateIcon from "~/icons/Undelegate";
import WithdrawIcon from "~/icons/Withdraw";
import { ScreenName, NavigatorName } from "~/const";
import { rgba } from "../../../../../../../colors";

/*
 * Handle the hook declaration.
 */

const useDrawerActions = (
  data: DrawerPropsType["data"],
  account: ElrondAccount,
  onClose: DrawerPropsType["onClose"],
) => {
  const navigation: StackNavigationProp<NavigationType> = useNavigation();

  const { type, claimableRewards, seconds, validator, amount } = data;
  const { t } = useTranslation();
  const { colors } = useTheme();

  /*
   * Callback triggering the collect rewards action in the drawer.
   */

  const onCollectRwards = useCallback(() => {
    onClose();
    navigation.navigate(NavigatorName.ElrondClaimRewardsFlow, {
      screen: ScreenName.ElrondClaimRewardsMethod,
      params: {
        account,
        value: claimableRewards,
        recipient: validator.contract,
        name: validator.identity.name || validator.contract,
      },
    });
  }, [validator, account, navigation, onClose, claimableRewards]);

  /*
   * Callback triggering the withdraw funds action in the drawer.
   */

  const onWithdrawFunds = useCallback(() => {
    onClose();
    navigation.navigate(NavigatorName.ElrondWithdrawFlow, {
      screen: ScreenName.ElrondWithdrawFunds,
      params: { account, amount, validator },
    });
  }, [validator, account, navigation, onClose, amount]);

  /*
   * Callback triggering the assets' undelegation action in the drawer.
   */

  const onUndelegation = useCallback(() => {
    onClose();
    navigation.navigate(NavigatorName.ElrondUndelegationFlow, {
      screen: ScreenName.ElrondUndelegationAmount,
      params: { account, validator, amount: new BigNumber(amount) },
    });
  }, [validator, account, navigation, onClose, amount]);

  const [isDelegation, isUndelegation] = useMemo(
    () => [type === "delegation", type === "undelegation"],
    [type],
  );

  /*
   * Check if the current delegation has any rewards available to collect.
   */

  const rewardsEnabled = useMemo(
    () => (isDelegation && claimableRewards ? new BigNumber(claimableRewards).isGreaterThan(0) : 0),
    [isDelegation, claimableRewards],
  );

  /*
   * Check if the current undelegation's withdrawal's seconds remaining to collect have hit zero.
   */

  const withdrawalEnabled = useMemo(
    () => (isUndelegation ? seconds === 0 : false),
    [isUndelegation, seconds],
  );

  /*
   * If the current used actions are for a delegation, push to the actions' array the rewards collecting and undelegation actions.
   */

  const delegationActions: Action[] = useMemo(
    () =>
      isDelegation
        ? [
            {
              label: t("delegation.actions.collectRewards"),
              disabled: !rewardsEnabled,
              onPress: onCollectRwards,
              event: "DelegationActionCollectRewards",
              Icon: (props: IconProps) => (
                <Circle {...props} bg={rewardsEnabled ? rgba(colors.yellow, 0.2) : colors.lightFog}>
                  <ClaimRewardIcon color={rewardsEnabled ? undefined : colors.grey} />
                </Circle>
              ),
            },
            {
              label: t("delegation.actions.undelegate"),
              onPress: onUndelegation,
              event: "DelegationActionUndelegate",
              disabled: amount.isZero(),
              Icon: (props: IconProps) => (
                <Circle {...props} bg={amount.isZero() ? colors.lightFog : rgba(colors.alert, 0.2)}>
                  <UndelegateIcon color={amount.isZero() ? colors.grey : undefined} />
                </Circle>
              ),
            },
          ]
        : [],
    [isDelegation, rewardsEnabled, colors, amount, t, onUndelegation, onCollectRwards],
  );

  /*
   * If the current used actions are for a undelegation, push to the actions' array the withdrawal action.
   */

  const undelegationActions: Action[] = useMemo(
    () =>
      isUndelegation
        ? [
            {
              label: t("delegation.actions.withdraw"),
              disabled: !withdrawalEnabled,
              onPress: onWithdrawFunds,
              event: "DelegationActionWithdraw",
              Icon: (props: IconProps) => (
                <Circle
                  {...props}
                  bg={withdrawalEnabled ? rgba(colors.green, 0.2) : colors.lightFog}
                >
                  <WithdrawIcon size={24} color={withdrawalEnabled ? colors.green : colors.grey} />
                </Circle>
              ),
            },
          ]
        : [],
    [isUndelegation, colors, t, onWithdrawFunds, withdrawalEnabled],
  );

  /*
   * Conditionally return the memoized actions, based on the array with available items.
   */

  const actions = useMemo(
    () =>
      delegationActions.length
        ? delegationActions
        : undelegationActions.length
        ? undelegationActions
        : [],
    [delegationActions, undelegationActions],
  );

  /*
   * Return the hook's payload.
   */

  return actions;
};

export default useDrawerActions;
