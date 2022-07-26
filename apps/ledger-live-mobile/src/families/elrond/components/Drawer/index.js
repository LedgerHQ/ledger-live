// @flow
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Linking } from "react-native";
import { BigNumber } from "bignumber.js";
import { useNavigation, useTheme } from "@react-navigation/native";

import DelegationDrawer, {
  IconProps,
} from "../../../../components/DelegationDrawer";
import Touchable from "../../../../components/Touchable";
import { rgba } from "../../../../colors";
import Circle from "../../../../components/Circle";
import LText from "../../../../components/LText";
import FirstLetterIcon from "../../../../components/FirstLetterIcon";
import UndelegateIcon from "../../../../icons/Undelegate";
import ClaimRewardIcon from "../../../../icons/ClaimReward";
import WithdrawIcon from "../../../../icons/Withdraw";
import DateFromNow from "../../../../components/DateFromNow";
import { denominate } from "../../helpers";
import { constants } from "../../constants";
import { ScreenName, NavigatorName } from "../../../../const";

const styles = StyleSheet.create({
  valueText: {
    fontSize: 14,
  },
});

const Drawer = (props: any) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { onCloseDrawer, account, drawer } = props;

  const [provider] = drawer.validator.providers;
  const letter = drawer.validator.name || provider;

  const navigation = useNavigation();
  const rewardsEnabled =
    drawer.source === "delegation" &&
    BigNumber(drawer.meta.claimableRewards).gt(0);

  const onCollectRewards = useCallback(() => {
    if (drawer.source === "delegation") {
      navigation.navigate(NavigatorName.ElrondClaimRewardsFlow, {
        screen: ScreenName.ElrondClaimRewardsMethod,
        params: {
          contract: provider,
          validator: drawer.validator,
          value: drawer.meta.claimableRewards,
          account,
        },
      });
    }
  }, [
    account,
    navigation,
    provider,
    drawer.source,
    drawer.validator,
    drawer.meta.claimableRewards,
  ]);

  const onUndelegate = useCallback(() => {
    if (drawer.source === "delegation") {
      navigation.navigate(NavigatorName.ElrondUndelegationFlow, {
        screen: ScreenName.ElrondUndelegationAmount,
        params: {
          delegations: drawer.meta.delegations,
          contract: provider,
          validator: drawer.validator,
          amount: drawer.amount,
          account,
        },
      });
    }
  }, [
    drawer.amount,
    navigation,
    drawer.source,
    account,
    provider,
    drawer.validator,
    drawer.meta.delegations,
  ]);

  const onWithdraw = useCallback(() => {
    if (drawer.source === "undelegation") {
      navigation.navigate(NavigatorName.ElrondWithdrawFlow, {
        screen: ScreenName.ElrondWithdrawMethod,
        params: {
          contract: provider,
          validator: drawer.validator,
          amount: drawer.amount,
          account,
        },
      });
    }
  }, [
    drawer.amount,
    navigation,
    drawer.source,
    account,
    provider,
    drawer.validator,
  ]);

  const data = useMemo(
    () =>
      drawer
        ? [
            {
              label: t("delegation.validator"),
              Component: (
                <LText
                  numberOfLines={1}
                  semiBold={true}
                  ellipsizeMode="middle"
                  style={[styles.valueText]}
                  color="live"
                >
                  {drawer.validator.name || provider || ""}
                </LText>
              ),
            },
            {
              label: t("delegation.validatorAddress"),
              Component: (
                <Touchable
                  onPress={() =>
                    Linking.openURL(
                      `${constants.explorer}/providers/${provider}`,
                    )
                  }
                  event="DelegationOpenExplorer"
                >
                  <LText
                    numberOfLines={1}
                    semiBold={true}
                    ellipsizeMode="middle"
                    style={[styles.valueText]}
                    color="live"
                  >
                    {provider}
                  </LText>
                </Touchable>
              ),
            },
            {
              label: t("delegation.delegatedAccount"),
              Component: (
                <LText
                  numberOfLines={1}
                  semiBold={true}
                  ellipsizeMode="middle"
                  style={[styles.valueText]}
                  color="live"
                >
                  {account.name}{" "}
                </LText>
              ),
            },
            {
              label: t("elrond.delegation.drawer.status"),
              Component: (
                <LText
                  numberOfLines={1}
                  semiBold
                  ellipsizeMode="middle"
                  style={[styles.valueText]}
                  color="live"
                >
                  {drawer.source === "delegation" &&
                    t("elrond.delegation.drawer.active")}

                  {drawer.source === "undelegation" &&
                    t("elrond.delegation.drawer.inactive")}
                </LText>
              ),
            },
            ...(drawer.source === "delegation"
              ? [
                  {
                    label: t("elrond.delegation.drawer.rewards"),
                    Component: (
                      <LText
                        numberOfLines={1}
                        semiBold={true}
                        style={[styles.valueText]}
                      >
                        {denominate({
                          input: drawer.meta.claimableRewards,
                          showLastNonZeroDecimal: true,
                        })}{" "}
                        {constants.egldLabel}
                      </LText>
                    ),
                  },
                ]
              : []),
            ...(drawer.source === "undelegation" && drawer.meta.seconds > 0
              ? [
                  {
                    label: t("elrond.delegation.drawer.completionDate"),
                    Component: (
                      <LText numberOfLines={1} semiBold={true}>
                        <DateFromNow
                          date={new Date(
                            new Date(
                              new Date().getTime() + 1000 * drawer.meta.seconds,
                            ).toISOString(),
                          ).getTime()}
                        />
                      </LText>
                    ),
                  },
                ]
              : []),
          ]
        : [],
    [t, drawer, provider, account],
  );

  const actions = useMemo(
    () =>
      drawer.source === "delegation"
        ? [
            {
              label: t("delegation.actions.collectRewards"),
              Icon: (props: IconProps) => (
                <Circle
                  {...props}
                  bg={
                    rewardsEnabled ? rgba(colors.yellow, 0.2) : colors.lightFog
                  }
                >
                  <ClaimRewardIcon color={!rewardsEnabled && colors.grey} />
                </Circle>
              ),
              disabled: !rewardsEnabled,
              onPress: onCollectRewards,
              event: "DelegationActionCollectRewards",
            },
            {
              label: t("delegation.actions.undelegate"),
              Icon: (props: IconProps) => (
                <Circle {...props} bg={colors.lightFog}>
                  <UndelegateIcon />
                </Circle>
              ),
              disabled: false,
              onPress: onUndelegate,
              event: "DelegationActionUndelegate",
            },
          ]
        : [
            {
              label: t("delegation.actions.withdraw"),
              Icon: (props: IconProps) => (
                <Circle {...props} bg={colors.lightFog}>
                  <WithdrawIcon size={24} color={colors.green} />
                </Circle>
              ),
              disabled: false,
              onPress: onWithdraw,
              event: "DelegationActionWithdraw",
            },
          ],
    [
      t,
      onCollectRewards,
      onUndelegate,
      onWithdraw,
      colors.grey,
      colors.lightFog,
      colors.yellow,
      colors.green,
      drawer.source,
      rewardsEnabled,
    ],
  );

  return (
    <DelegationDrawer
      isOpen={true}
      onClose={onCloseDrawer}
      ValidatorImage={({ size }) => (
        <FirstLetterIcon
          label={letter || ""}
          round={true}
          size={size}
          fontSize={24}
        />
      )}
      amount={drawer.amount ?? BigNumber(0)}
      {...{ data, account, actions }}
    />
  );
};

export default Drawer;
