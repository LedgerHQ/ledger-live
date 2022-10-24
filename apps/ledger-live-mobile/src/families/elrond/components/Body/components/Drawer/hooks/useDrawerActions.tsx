import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import BigNumber from "bignumber.js";

import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { DrawerPropsType } from "../types";

import Circle from "../../../../../../../components/Circle";
import ClaimRewardIcon from "../../../../../../../icons/ClaimReward";
import UndelegateIcon from "../../../../../../../icons/Undelegate";
import WithdrawIcon from "../../../../../../../icons/Withdraw";
import { ScreenName, NavigatorName } from "../../../../../../../const";
import { rgba } from "../../../../../../../colors";

import type {
  Action,
  IconProps,
} from "../../../../../../../components/DelegationDrawer";

const useDrawerActions = (
  data: DrawerPropsType["data"],
  account: ElrondAccount,
  onClose: DrawerPropsType["onClose"],
) => {
  const navigation = useNavigation();

  const { type, claimableRewards, seconds, validator, amount } = data;
  const { t } = useTranslation();
  const { colors } = useTheme();

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

  const onWithdrawFunds = useCallback(() => {
    onClose();
    navigation.navigate(NavigatorName.ElrondWithdrawFlow, {
      screen: ScreenName.ElrondWithdrawFunds,
      params: { account, amount, validator },
    });
  }, [validator, account, navigation, onClose, amount]);

  const onUndelegation = useCallback(() => {
    onClose();
    navigation.navigate(NavigatorName.ElrondUndelegationFlow, {
      screen: ScreenName.ElrondUndelegationValidator,
      params: { account, validator, amount: new BigNumber(amount) },
    });
  }, [validator, account, navigation, onClose, amount]);

  const [isDelegation, isUndelegation] = useMemo(
    () => [type === "delegation", type === "undelegation"],
    [type],
  );

  const rewardsEnabled = useMemo(
    () =>
      isDelegation && claimableRewards
        ? new BigNumber(claimableRewards).gt(0)
        : 0,
    [isDelegation, claimableRewards],
  );

  const withdrawalEnabled = useMemo(
    () => (isUndelegation ? seconds === 0 : false),
    [isUndelegation, seconds],
  );

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
                <Circle
                  {...props}
                  bg={
                    rewardsEnabled ? rgba(colors.yellow, 0.2) : colors.lightFog
                  }
                >
                  <ClaimRewardIcon
                    color={rewardsEnabled ? undefined : colors.grey}
                  />
                </Circle>
              ),
            },
            {
              label: t("delegation.actions.undelegate"),
              onPress: onUndelegation,
              event: "DelegationActionUndelegate",
              disabled: false,
              Icon: (props: IconProps) => (
                <Circle {...props} bg={rgba(colors.alert, 0.2)}>
                  <UndelegateIcon />
                </Circle>
              ),
            },
          ]
        : [],
    [isDelegation, rewardsEnabled, colors, t, onCollectRwards],
  );

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
                  bg={
                    withdrawalEnabled
                      ? rgba(colors.green, 0.2)
                      : colors.lightFog
                  }
                >
                  <WithdrawIcon
                    size={24}
                    color={withdrawalEnabled ? colors.green : colors.grey}
                  />
                </Circle>
              ),
            },
          ]
        : [],
    [isUndelegation, colors, t, onWithdrawFunds, withdrawalEnabled],
  );

  const actions = useMemo(
    () =>
      delegationActions.length
        ? delegationActions
        : undelegationActions.length
        ? undelegationActions
        : [],
    [delegationActions, undelegationActions],
  );

  return actions;
};

export default useDrawerActions;
