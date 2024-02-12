import React, { useCallback, useState, useMemo } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { getAccountUnit, getMainAccount } from "@ledgerhq/live-common/account/index";
import type {
  CardanoAccount,
  CardanoDelegation,
} from "@ledgerhq/live-common/families/cardano/types";
import { LEDGER_POOL_IDS } from "@ledgerhq/live-common/families/cardano/utils";
import { getDefaultExplorerView, getStakePoolExplorer } from "@ledgerhq/live-common/explorers";

import { StackNavigationProp } from "@react-navigation/stack";
import { AccountLike } from "@ledgerhq/types-live";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import DelegationDrawer from "~/components/DelegationDrawer";
import type { IconProps } from "~/components/DelegationDrawer";
import Circle from "~/components/Circle";
import LText from "~/components/LText";
import Touchable from "~/components/Touchable";
import { rgba } from "../../../colors";
import IlluRewards from "~/icons/images/Rewards";
import { urls } from "~/utils/urls";
import { ScreenName, NavigatorName } from "~/const";
import RedelegateIcon from "~/icons/Redelegate";
import UndelegateIcon from "~/icons/Undelegate";
import DelegationRow from "./Row";
import PoolImage from "../shared/PoolImage";

type Props = {
  account: CardanoAccount;
};

type DelegationDrawerProps = React.ComponentProps<typeof DelegationDrawer>;
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function Delegations({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const mainAccount = getMainAccount(account, undefined);

  const unit = getAccountUnit(account);
  const navigation = useNavigation();

  const { cardanoResources } = account;
  const d = cardanoResources.delegation;

  const [delegation, setDelegation] = useState<CardanoDelegation>();

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
      setDelegation(undefined);
      (navigation as StackNavigationProp<{ [key: string]: object }>).navigate(route, {
        screen,
        params: { ...params, accountId: account.id },
      });
    },
    [navigation, account.id],
  );

  const onDelegate = useCallback(() => {
    onNavigate({
      route: NavigatorName.CardanoDelegationFlow,
      screen: ScreenName.CardanoDelegationStarted,
    });
  }, [onNavigate]);

  const onRedelegate = useCallback(() => {
    onNavigate({
      route: NavigatorName.CardanoDelegationFlow,
      screen: ScreenName.CardanoDelegationSummary,
    });
  }, [onNavigate]);

  const onUndelegate = useCallback(() => {
    onNavigate({
      route: NavigatorName.CardanoUndelegationFlow,
      screen: ScreenName.CardanoUndelegationSummary,
      params: {
        accountId: account.id,
        delegation,
      },
    });
  }, [onNavigate, delegation, account]);

  const onCloseDrawer = useCallback(() => {
    setDelegation(undefined);
  }, []);

  const onOpenExplorer = useCallback(
    (address: string) => {
      const explorerView = getDefaultExplorerView(account.currency);
      const srURL = explorerView && getStakePoolExplorer(explorerView, address);

      if (srURL) Linking.openURL(srURL);
    },
    [account.currency],
  );

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    const d = delegation;

    return d
      ? [
          {
            label: t("cardano.delegation.pool"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {d.name ?? d.poolId ?? ""}
              </LText>
            ),
          },
          {
            label: t("cardano.delegation.poolId"),
            Component: (
              <Touchable onPress={() => onOpenExplorer(d.poolId)} event="DelegationOpenExplorer">
                <LText
                  numberOfLines={1}
                  semiBold
                  ellipsizeMode="middle"
                  style={[styles.valueText]}
                  color="live"
                >
                  {d.poolId}
                </LText>
              </Touchable>
            ),
          },
          {
            label: t("delegation.delegatedAccount"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {account.name}{" "}
              </LText>
            ),
          },
          {
            label: t("cardano.delegation.drawer.status"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {d.status
                  ? t("cardano.delegation.drawer.active")
                  : t("cardano.delegation.drawer.inactive")}
              </LText>
            ),
          },
          ...(delegation
            ? [
                {
                  label: t("cardano.delegation.drawer.rewards"),
                  Component: (
                    <LText numberOfLines={1} semiBold style={[styles.valueText]}>
                      {delegation.rewards.toString() ?? ""}
                    </LText>
                  ),
                },
              ]
            : []),
        ]
      : [];
  }, [delegation, t, account, onOpenExplorer]);

  const actions = useMemo<DelegationDrawerActions>(() => {
    return [
      {
        label: t("delegation.actions.redelegate"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={colors.fog}>
            <RedelegateIcon color={undefined} />
          </Circle>
        ),
        disabled: false,
        onPress: onRedelegate,
        event: "DelegationActionRedelegate",
      },
      {
        label: t("delegation.actions.undelegate"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.alert, 0.2)}>
            <UndelegateIcon />
          </Circle>
        ),
        disabled: false,
        onPress: onUndelegate,
        event: "DelegationActionUndelegate",
      },
    ];
  }, [t, onRedelegate, onUndelegate, colors.alert, colors.fog]);

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={data && data.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <PoolImage
            isLedger={LEDGER_POOL_IDS.includes(delegation?.poolId || "")}
            name={delegation?.name ?? delegation?.poolId ?? ""}
            size={size}
          />
        )}
        amount={mainAccount.balance}
        data={data}
        actions={actions}
      />

      {d && d.poolId ? (
        <View style={styles.wrapper}>
          <AccountSectionLabel name={t("cardano.delegation.header")} />
          <View key={d.poolId} style={[styles.delegationsWrapper]}>
            <DelegationRow
              balance={account.balance}
              delegation={d}
              unit={unit}
              currency={account.currency}
              onPress={() => setDelegation(d)}
            />
          </View>
        </View>
      ) : (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("cardano.delegation.delegationEarn", {
            name: account.currency.name,
          })}
          infoUrl={urls.cardanoStaking}
          infoTitle={t("cardano.delegation.info")}
          onPress={onDelegate}
          ctaTitle={t("account.delegation.info.cta")}
        />
      )}
    </View>
  );
}

export default function CardanoDelegations({ account }: { account: AccountLike }) {
  if (!(account as CardanoAccount).cardanoResources) return null;
  return <Delegations account={account as CardanoAccount} />;
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
