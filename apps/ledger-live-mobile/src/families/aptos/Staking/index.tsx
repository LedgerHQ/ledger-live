import { BigNumber } from "bignumber.js";
import React, { useCallback, useState, useMemo } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { useAptosMappedStakingPositions } from "@ledgerhq/live-common/families/aptos/react";
import type {
  AptosMappedStakingPosition,
  AptosAccount,
} from "@ledgerhq/live-common/families/aptos/types";
import {
  canStake,
  canUnstake,
  canWithdraw,
  canRestake,
} from "@ledgerhq/live-common/families/aptos/staking";
import { Account } from "@ledgerhq/types-live";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import IlluRewards from "~/icons/images/Rewards";
import { urls } from "~/utils/urls";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import DelegationDrawer from "~/components/DelegationDrawer";
import type { IconProps } from "~/components/DelegationDrawer";
import Touchable from "~/components/Touchable";
import { rgba } from "../../../colors";
import { ScreenName, NavigatorName } from "~/const";
import Circle from "~/components/Circle";
import LText from "~/components/LText";
import UndelegateIcon from "~/icons/Undelegate";
import ClaimRewardIcon from "~/icons/ClaimReward";
import RedelegateIcon from "~/icons/Redelegate";
import StakingPositionRow from "./Row";
import LabelRight from "./LabelRight";
import ValidatorImage from "../shared/ValidatorImage";

type Props = {
  account: Account;
};

type DelegationDrawerProps = React.ComponentProps<typeof DelegationDrawer>;
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function StakingPositions({ account }: Readonly<Props>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account) as AptosAccount;
  const stakingPositions: AptosMappedStakingPosition[] =
    useAptosMappedStakingPositions(mainAccount);

  const currency = getAccountCurrency(mainAccount);
  const navigation = useNavigation();

  const [stakingPosition, setStakingPosition] = useState<AptosMappedStakingPosition>();

  const onNavigate = useCallback(
    ({
      route,
      screen,
      params,
    }: {
      route: string;
      screen?: string;
      params?: { [key: string]: unknown };
    }) => {
      setStakingPosition(undefined);
      // This is complicated (even impossible?) to type properly…
      (navigation as StackNavigationProp<{ [key: string]: object }>).navigate(route, {
        screen,
        params: { ...params, accountId: account.id },
      });
    },
    [navigation, account.id],
  );

  const onStake = useCallback(() => {
    onNavigate({
      route: NavigatorName.AptosStakingFlow,
      screen:
        stakingPositions.length > 0
          ? ScreenName.AptosStakingValidator
          : ScreenName.AptosStakingStarted,
    });
  }, [onNavigate, stakingPositions]);

  const onUnstake = useCallback(() => {
    onNavigate({
      route: NavigatorName.AptosUnstakingFlow,
      screen: ScreenName.AptosUnstakingAmount,
      params: {
        accountId: account.id,
        stakingPosition,
      },
    });
  }, [onNavigate, stakingPosition, account]);

  const onWithdraw = useCallback(() => {
    onNavigate({
      route: NavigatorName.AptosWithdrawingFlow,
      screen: ScreenName.AptosWithdrawingAmount,
      params: {
        accountId: account.id,
        stakingPosition,
      },
    });
  }, [onNavigate, stakingPosition, account]);

  const onRestake = useCallback(() => {
    onNavigate({
      route: NavigatorName.AptosRestakingFlow,
      screen: ScreenName.AptosRestakingAmount,
      params: {
        accountId: account.id,
        stakingPosition,
      },
    });
  }, [onNavigate, stakingPosition, account]);

  const onCloseDrawer = useCallback(() => setStakingPosition(undefined), []);

  const onOpenExplorer = useCallback(
    (address: string) => {
      const url = getAddressExplorer(getDefaultExplorerView(account.currency), address);
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
            label: t("aptos.staking.drawer.status"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {stakingPosition.active.gt(0)
                  ? t("aptos.staking.drawer.active")
                  : t("aptos.staking.drawer.inactive")}
              </LText>
            ),
          },
          {
            label: t("aptos.staking.drawer.pending"),
            Component: (
              <LText numberOfLines={1} semiBold style={[styles.valueText]}>
                {stakingPosition.formattedPending ?? ""}
              </LText>
            ),
          },
          {
            label: t("aptos.staking.drawer.available"),
            Component: (
              <LText numberOfLines={1} semiBold style={[styles.valueText]}>
                {stakingPosition.formattedAvailable ?? ""}
              </LText>
            ),
          },
        ]
      : [];
  }, [stakingPosition, t, onOpenExplorer]);

  const actions = useMemo<DelegationDrawerActions>(() => {
    const unstakingEnabled = stakingPosition && canUnstake(stakingPosition);
    const withdrawingEnabled = stakingPosition && canWithdraw(stakingPosition);
    const restakingEnabled = stakingPosition && canRestake(stakingPosition);

    return stakingPosition
      ? [
          {
            label: t("aptos.staking.actions.unstake"),
            Icon: (props: IconProps) => (
              <Circle {...props} bg={!unstakingEnabled ? colors.lightFog : rgba(colors.alert, 0.2)}>
                <UndelegateIcon color={!unstakingEnabled ? colors.grey : undefined} />
              </Circle>
            ),
            disabled: !unstakingEnabled,
            onPress: onUnstake,
            event: "StakingActionUnstake",
          },
          {
            label: t("aptos.staking.actions.withdraw"),
            Icon: (props: IconProps) => (
              <Circle
                {...props}
                bg={!withdrawingEnabled ? colors.lightFog : rgba(colors.yellow, 0.2)}
              >
                <ClaimRewardIcon color={!withdrawingEnabled ? colors.grey : undefined} />
              </Circle>
            ),
            disabled: !withdrawingEnabled,
            onPress: onWithdraw,
            event: "StakingActionWithdraw",
          },
          {
            label: t("aptos.staking.actions.restake"),
            Icon: (props: IconProps) => (
              <Circle
                {...props}
                bg={!restakingEnabled ? colors.lightFog : rgba(colors.yellow, 0.2)}
              >
                <RedelegateIcon color={!restakingEnabled ? colors.grey : undefined} />
              </Circle>
            ),
            disabled: !restakingEnabled,
            onPress: onRestake,
            event: "StakingActionRestake",
          },
        ]
      : [];
  }, [
    stakingPosition,
    t,
    onUnstake,
    onWithdraw,
    onRestake,
    colors.lightFog,
    colors.grey,
    colors.yellow,
    colors.alert,
  ]);

  const stakingDisabled = stakingPositions.length <= 0 || !canStake(account as AptosAccount);

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={data && data.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <ValidatorImage isLedger={false} name={stakingPosition?.validatorId ?? ""} size={size} />
        )}
        amount={stakingPosition?.active ?? new BigNumber(0)}
        data={data}
        actions={actions}
      />

      {stakingPositions.length === 0 ? (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("aptos.staking.stakingEarn", {
            name: account.currency.name,
          })}
          infoUrl={urls.stakingRewards}
          infoTitle={t("aptos.staking.info")}
          onPress={onStake}
          ctaTitle={t("account.delegation.info.cta")}
        />
      ) : (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("aptos.staking.sectionLabel")}
            RightComponent={<LabelRight disabled={stakingDisabled} onPress={onStake} />}
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

export default function AptosStakingPositions(props: Readonly<Props>) {
  const { account } = props as { account: AptosAccount };
  if (!account.aptosResources) return null;
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
