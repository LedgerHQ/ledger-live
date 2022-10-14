import { BigNumber } from "bignumber.js";
import React, { useCallback, useState, useMemo, ElementProps } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/explorers";
import { useNearMappedStakingPositions } from "@ledgerhq/live-common/families/near/react";
import type {
  NearMappedStakingPosition,
  NearAccount,
} from "@ledgerhq/live-common/families/near/types";
import {
  canStake,
  canUnstake,
  canWithdraw,
  FIGMENT_NEAR_VALIDATOR_ADDRESS,
} from "@ledgerhq/live-common/families/near/logic";
import AccountDelegationInfo from "../../../components/AccountDelegationInfo";
import IlluRewards from "../../../icons/images/Rewards";
import { urls } from "../../../config/urls";
import AccountSectionLabel from "../../../components/AccountSectionLabel";
import DelegationDrawer from "../../../components/DelegationDrawer";
import type { IconProps } from "../../../components/DelegationDrawer";
import Touchable from "../../../components/Touchable";
import { rgba } from "../../../colors";
import { ScreenName, NavigatorName } from "../../../const";
import Circle from "../../../components/Circle";
import LText from "../../../components/LText";
import UndelegateIcon from "../../../icons/Undelegate";
import ClaimRewardIcon from "../../../icons/ClaimReward";
import StakingPositionRow from "./Row";
import LabelRight from "./LabelRight";
import ValidatorImage from "../shared/ValidatorImage";

type Props = {
  account: NearAccount;
};

type DelegationDrawerProps = ElementProps<typeof DelegationDrawer>;
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function StakingPositions({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account);
  const stakingPositions: NearMappedStakingPosition[] =
    useNearMappedStakingPositions(mainAccount);

  const currency = getAccountCurrency(mainAccount);
  const navigation = useNavigation();

  const [stakingPosition, setStakingPosition] =
    useState<NearMappedStakingPosition>();

  const onNavigate = useCallback(
    ({
      route,
      screen,
      params,
    }: {
      route: typeof NavigatorName | typeof ScreenName;
      screen?: typeof ScreenName;
      params?: { [key: string]: any };
    }) => {
      setStakingPosition();
      navigation.navigate(route, {
        screen,
        params: { ...params, accountId: account.id },
      });
    },
    [navigation, account.id],
  );

  const onStake = useCallback(() => {
    onNavigate({
      route: NavigatorName.NearStakingFlow,
      screen:
        stakingPositions.length > 0
          ? ScreenName.NearStakingValidator
          : ScreenName.NearStakingStarted,
    });
  }, [onNavigate, stakingPositions]);

  const onUnstake = useCallback(() => {
    onNavigate({
      route: NavigatorName.NearUnstakingFlow,
      screen: ScreenName.NearUnstakingAmount,
      params: {
        accountId: account.id,
        stakingPosition,
      },
    });
  }, [onNavigate, stakingPosition, account]);

  const onWithdraw = useCallback(() => {
    onNavigate({
      route: NavigatorName.NearWithdrawingFlow,
      screen: ScreenName.NearWithdrawingAmount,
      params: {
        accountId: account.id,
        stakingPosition,
      },
    });
  }, [onNavigate, stakingPosition, account]);

  const onCloseDrawer = useCallback(() => setStakingPosition(), []);

  const onOpenExplorer = useCallback(
    (address: string) => {
      const url = getAddressExplorer(
        getDefaultExplorerView(account.currency),
        address,
      );
      if (url) Linking.openURL(url);
    },
    [account.currency],
  );

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    return stakingPosition
      ? [
          {
            label: t("delegation.validatorAddress"),
            Component: (
              <Touchable
                onPress={() => onOpenExplorer(stakingPosition.validatorId)}
                event="StakingOpenExplorer"
              >
                <LText
                  numberOfLines={1}
                  semiBold
                  ellipsizeMode="middle"
                  style={[styles.valueText]}
                  color="live"
                >
                  {stakingPosition.validatorId}
                </LText>
              </Touchable>
            ),
          },
          {
            label: t("near.staking.drawer.status"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {stakingPosition.staked.gt(0)
                  ? t("near.staking.drawer.active")
                  : t("near.staking.drawer.inactive")}
              </LText>
            ),
          },
          {
            label: t("near.staking.drawer.rewards"),
            Component: (
              <LText numberOfLines={1} semiBold style={[styles.valueText]}>
                {stakingPosition.formattedRewards ?? ""}
              </LText>
            ),
          },
          {
            label: t("near.staking.drawer.pending"),
            Component: (
              <LText numberOfLines={1} semiBold style={[styles.valueText]}>
                {stakingPosition.formattedPending ?? ""}
              </LText>
            ),
          },
          {
            label: t("near.staking.drawer.available"),
            Component: (
              <LText numberOfLines={1} semiBold style={[styles.valueText]}>
                {stakingPosition.formattedAvailable ?? ""}
              </LText>
            ),
          },
        ]
      : [];
  }, [stakingPosition, t, account, onOpenExplorer]);

  const actions = useMemo<DelegationDrawerActions>(() => {
    const unstakingEnabled = stakingPosition && canUnstake(stakingPosition);
    const withdrawingEnabled = stakingPosition && canWithdraw(stakingPosition);

    return stakingPosition
      ? [
          {
            label: t("near.staking.actions.unstake"),
            Icon: (props: IconProps) => (
              <Circle
                {...props}
                bg={
                  !unstakingEnabled ? colors.lightFog : rgba(colors.alert, 0.2)
                }
              >
                <UndelegateIcon
                  color={!unstakingEnabled ? colors.grey : undefined}
                />
              </Circle>
            ),
            disabled: !unstakingEnabled,
            onPress: onUnstake,
            event: "StakingActionUnstake",
          },
          {
            label: t("near.staking.actions.withdraw"),
            Icon: (props: IconProps) => (
              <Circle
                {...props}
                bg={
                  !withdrawingEnabled
                    ? colors.lightFog
                    : rgba(colors.yellow, 0.2)
                }
              >
                <ClaimRewardIcon
                  color={!withdrawingEnabled ? colors.grey : undefined}
                />
              </Circle>
            ),
            disabled: !withdrawingEnabled,
            onPress: onWithdraw,
            event: "StakingActionWithdraw",
          },
        ]
      : [];
  }, [
    stakingPosition,
    t,
    onUnstake,
    onWithdraw,
    colors.lightFog,
    colors.grey,
    colors.yellow,
    colors.alert,
  ]);

  const stakingDisabled = stakingPositions.length <= 0 || !canStake(account);

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={data && data.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <ValidatorImage
            isLedger={
              stakingPosition?.validatorId === FIGMENT_NEAR_VALIDATOR_ADDRESS
            }
            name={stakingPosition?.validatorId ?? ""}
            size={size}
          />
        )}
        amount={stakingPosition?.staked ?? new BigNumber(0)}
        data={data}
        actions={actions}
      />

      {stakingPositions.length === 0 ? (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("near.staking.stakingEarn", {
            name: account.currency.name,
          })}
          infoUrl={urls.nearStakingRewards}
          infoTitle={t("near.staking.info")}
          onPress={onStake}
          ctaTitle={t("account.delegation.info.cta")}
        />
      ) : (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("near.staking.sectionLabel")}
            RightComponent={
              <LabelRight disabled={stakingDisabled} onPress={onStake} />
            }
          />
          {stakingPositions.map((sp, i) => (
            <View key={sp.validatorId} style={[styles.delegationsWrapper]}>
              <StakingPositionRow
                stakingPosition={sp}
                currency={currency}
                onPress={() => setStakingPosition(sp)}
                isLast={i === stakingPositions.length - 1}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function NearStakingPositions({ account }: Props) {
  if (!account.nearResources) return null;
  return <StakingPositions account={account} />;
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  rewardsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    paddingVertical: 16,
    marginBottom: 16,
    borderRadius: 4,
  },
  label: {
    fontSize: 20,
    flex: 1,
  },
  subLabel: {
    fontSize: 14,
    flex: 1,
  },
  column: {
    flexDirection: "column",
  },
  wrapper: {
    marginBottom: 16,
  },
  delegationsWrapper: {
    borderRadius: 4,
  },
  valueText: {
    fontSize: 14,
  },
});
