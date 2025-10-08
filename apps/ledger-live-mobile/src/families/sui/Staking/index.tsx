import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { useSuiMappedStakingPositions } from "@ledgerhq/live-common/families/sui/react";
import type { MappedStake, SuiAccount } from "@ledgerhq/live-common/families/sui/types";
import { Account } from "@ledgerhq/types-live";
import { useNavigation, useTheme } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import Circle from "~/components/Circle";
import type { IconProps } from "~/components/DelegationDrawer";
import DelegationDrawer from "~/components/DelegationDrawer";
import LText from "~/components/LText";
import Touchable from "~/components/Touchable";
import { NavigatorName, ScreenName } from "~/const";
import UndelegateIcon from "~/icons/Undelegate";
import { rgba } from "../../../colors";
import LabelRight from "./LabelRight";
import StakingPositionRow from "./Row";
import ValidatorImageWrapper from "./ValidatorImageWrapper";

const UnstakeActionIcon =
  ({ alertColor }: { alertColor: string }) =>
  (props: IconProps) => (
    <Circle {...props} bg={rgba(alertColor, 0.2)}>
      <UndelegateIcon color={undefined} />
    </Circle>
  );

type Props = {
  readonly account: Account;
};

type DelegationDrawerProps = React.ComponentProps<typeof DelegationDrawer>;
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function StakingPositions({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account);
  const stakingPositions = useSuiMappedStakingPositions(mainAccount);

  const currency = getAccountCurrency(mainAccount);
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();

  const [stakingPosition, setStakingPosition] = useState<MappedStake>();

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
      navigation.navigate(route, {
        screen,
        params: { ...params, accountId: account.id },
      });
    },
    [navigation, account.id],
  );

  const onStake = useCallback(() => {
    onNavigate({
      route: NavigatorName.SuiDelegateFlow,
      screen: ScreenName.SuiStakingValidator,
    });
  }, [onNavigate]);

  const onUnstake = useCallback(() => {
    onNavigate({
      route: NavigatorName.SuiUndelegateFlow,
      screen: ScreenName.SuiUnstakingAmount,
      params: {
        accountId: account.id,
        stakingPosition,
      },
    });
  }, [onNavigate, stakingPosition, account]);

  const onCloseDrawer = useCallback(() => setStakingPosition(undefined), []);

  const onOpenExplorer = useCallback(
    (address: string) => {
      const accountUrl = getDefaultExplorerView(account.currency)?.address ?? "";
      const index = accountUrl.indexOf("/account");
      const url = accountUrl.slice(0, index);
      if (index !== -1) Linking.openURL(`${url}/validator/${address}/info`);
    },
    [account.currency],
  );

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    return stakingPosition
      ? [
          {
            label: t("delegation.validator"),
            Component: (
              <Touchable
                onPress={() => onOpenExplorer(stakingPosition.validator.suiAddress)}
                event="StakingOpenExplorer"
              >
                <LText
                  numberOfLines={1}
                  semiBold
                  ellipsizeMode="middle"
                  style={[styles.valueText]}
                  color="live"
                >
                  {stakingPosition.validator.name}
                </LText>
              </Touchable>
            ),
          },
          {
            label: t("sui.info.estimatedReward"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {stakingPosition.formattedEstimatedReward}
              </LText>
            ),
          },
          {
            label: t("delegation.validatorAddress"),
            Component: (
              <Touchable
                onPress={() => onOpenExplorer(stakingPosition.stakedSuiId)}
                event="StakingOpenExplorer"
              >
                <LText
                  numberOfLines={1}
                  semiBold
                  ellipsizeMode="middle"
                  style={[styles.valueText]}
                  color="live"
                >
                  {stakingPosition.validator.suiAddress}
                </LText>
              </Touchable>
            ),
          },
          {
            label: t("sui.staking.drawer.status"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {stakingPosition.status === "Active"
                  ? t("sui.staking.drawer.active")
                  : t("sui.staking.drawer.inactive")}
              </LText>
            ),
          },
        ]
      : [];
  }, [stakingPosition, t, onOpenExplorer]);

  const actions = useMemo<DelegationDrawerActions>(() => {
    return stakingPosition
      ? [
          {
            label: t("sui.staking.actions.unstake"),
            Icon: UnstakeActionIcon({ alertColor: colors.alert }),
            onPress: onUnstake,
            event: "StakingActionUnstake",
          },
        ]
      : [];
  }, [stakingPosition, t, onUnstake, colors.alert]);

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={data && data.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <ValidatorImageWrapper size={size} stakingPosition={stakingPosition} />
        )}
        amount={
          stakingPosition?.principal ? new BigNumber(stakingPosition.principal) : new BigNumber(0)
        }
        data={data}
        actions={actions}
      />

      {stakingPositions.length > 0 && (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("sui.staking.sectionLabel")}
            RightComponent={<LabelRight onPress={onStake} />}
          />
          {stakingPositions.map((sp, i) => (
            <View key={sp.stakedSuiId} style={[styles.delegationsWrapper]}>
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

export default function SuiStakingPositions(props: Props) {
  const { account } = props as { account: SuiAccount };
  if (!account.suiResources) return null;
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
