// @flow

import React, { useCallback, useState, useMemo } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import type { CompoundAccountSummary } from "@ledgerhq/live-common/lib/compound/types";
import {
  getAccountName,
  getAccountCurrency,
} from "@ledgerhq/live-common/lib/account/helpers";
import { getAccountCapabilities } from "@ledgerhq/live-common/lib/compound/logic";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";
import LText from "../../../components/LText";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CurrencyIcon from "../../../components/CurrencyIcon";
import CounterValue from "../../../components/CounterValue";
import { rgba } from "../../../colors";
import DelegationDrawer from "../../../components/DelegationDrawer";
import Circle from "../../../components/Circle";
import Plus from "../../../icons/Plus";
import Supply from "../../../icons/Supply";
import Withdraw from "../../../icons/Withdraw";
import Compound, { compoundColor } from "../../../icons/Compound";
import { NavigatorName, ScreenName } from "../../../const";

type RowProps = {
  item: CompoundAccountSummary,
};

export default function ActiveAccountRow({ item }: RowProps) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const {
    account,
    parentAccount,
    totalSupplied,
    accruedInterests,
    status,
  } = item;
  const { token } = account;
  const name = getAccountName(parentAccount || account);
  const accountName = getAccountName(account);
  const currency = getAccountCurrency(account);
  const { canSupply, canWithdraw } = getAccountCapabilities(account) || {};

  const [isOpened, setIsOpened] = useState(false);

  const onOpenDrawer = useCallback(() => setIsOpened(true), []);
  const onCloseDrawer = useCallback(() => setIsOpened(false), []);

  const statusStyles = useMemo(
    () => ({
      EARNING: {
        backgroundColor: colors.live,
        color: colors.white,
      },
      ENABLING: {
        backgroundColor: colors.grey,
        color: colors.darkBlue,
      },
      INACTIVE: {
        backgroundColor: colors.lightLive,
        color: colors.live,
      },
      SUPPLYING: {
        backgroundColor: colors.live,
        color: colors.white,
      },
    }),
    [colors],
  );

  const data = useMemo(
    () => [
      {
        label: (
          <Trans i18nKey="transfer.lending.dashboard.activeAccount.account" />
        ),
        Component: <LText semiBold>{name}</LText>,
      },
      {
        label: (
          <Trans i18nKey="transfer.lending.dashboard.activeAccount.amountSupplied" />
        ),
        Component: (
          <LText semiBold>
            <CurrencyUnitValue
              unit={token.units[0]}
              value={totalSupplied}
              showCode
            />
          </LText>
        ),
      },
      {
        label: (
          <Trans i18nKey="transfer.lending.dashboard.activeAccount.interestEarned" />
        ),
        Component: (
          <LText semiBold>
            <CurrencyUnitValue
              unit={token.units[0]}
              value={accruedInterests}
              showCode
            />
          </LText>
        ),
      },
      ...(status
        ? [
            {
              label: (
                <Trans i18nKey="transfer.lending.dashboard.activeAccount.status" />
              ),
              Component: (
                <LText
                  semiBold
                  style={[
                    styles.statusPill,
                    { backgroundColor: colors.grey, color: colors.darkBlue },
                    statusStyles[status],
                  ]}
                >
                  <Trans
                    i18nKey={`transfer.lending.dashboard.activeAccount.${status}`}
                  />
                </LText>
              ),
            },
          ]
        : []),
    ],
    [
      name,
      token.units,
      totalSupplied,
      accruedInterests,
      status,
      colors.grey,
      colors.darkBlue,
      statusStyles,
    ],
  );

  const actions = useMemo(
    () => [
      {
        label: (
          <Trans i18nKey="transfer.lending.dashboard.activeAccount.approve" />
        ),
        Icon: (props: *) => (
          <Circle {...props} bg={colors.lightLive}>
            <Plus size={24} color={colors.live} />
          </Circle>
        ),
        event: "Lend Approve Manage ActiveAccounts",
        eventProperties: { currencyName: currency.name },
        disabled: false,
        onPress: () => {
          onCloseDrawer();
          navigation.navigate(NavigatorName.LendingEnableFlow, {
            screen: ScreenName.LendingEnableAmount,
            params: {
              accountId: account.id,
              parentId: account.parentId,
              currency,
            },
          });
        },
      },
      {
        label: (
          <Trans i18nKey="transfer.lending.dashboard.activeAccount.supply" />
        ),
        Icon: (props: *) => (
          <Circle
            {...props}
            bg={!canSupply ? colors.lightFog : colors.lightLive}
          >
            <Supply size={24} color={!canSupply ? colors.grey : colors.live} />
          </Circle>
        ),
        event: "Lend Supply Manage ActiveAccounts",
        eventProperties: { currencyName: currency.name },
        disabled: !canSupply,
        onPress: () => {
          onCloseDrawer();
          navigation.navigate(NavigatorName.LendingSupplyFlow, {
            screen: ScreenName.LendingSupplyAmount,
            params: {
              accountId: account.id,
              parentId: account.parentId,
              currency,
            },
          });
        },
      },
      {
        label: (
          <Trans i18nKey="transfer.lending.dashboard.activeAccount.withdraw" />
        ),
        Icon: (props: *) => (
          <Circle
            {...props}
            bg={!canWithdraw ? colors.lightFog : colors.lightLive}
          >
            <Withdraw
              size={24}
              color={!canWithdraw ? colors.grey : colors.live}
            />
          </Circle>
        ),
        event: "Lend Withdraw Manage ActiveAccounts",
        eventProperties: { currencyName: currency.name },
        disabled: !canWithdraw,
        onPress: () => {
          onCloseDrawer();
          navigation.navigate(NavigatorName.LendingWithdrawFlow, {
            screen: ScreenName.LendingWithdrawAmount,
            params: {
              accountId: account.id,
              parentId: account.parentId,
              currency,
            },
          });
        },
      },
    ],
    [
      account.id,
      account.parentId,
      canSupply,
      canWithdraw,
      colors.grey,
      colors.lightFog,
      colors.lightLive,
      colors.live,
      currency,
      navigation,
      onCloseDrawer,
    ],
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.card }]}
        onPress={onOpenDrawer}
      >
        <CurrencyIcon radius={100} currency={token} size={32} />
        <View style={styles.currencySection}>
          <LText
            numberOfLines={1}
            semiBold
            style={styles.subTitle}
            color="grey"
          >
            {name}
          </LText>
          <LText numberOfLines={1} semiBold style={styles.title}>
            {accountName}
          </LText>
        </View>
        <View style={[styles.currencySection, styles.alignEnd]}>
          <LText semiBold>
            <CurrencyUnitValue
              unit={token.units[0]}
              value={totalSupplied}
              showCode
            />
          </LText>
          <LText style={styles.subTitle} color="grey">
            <CounterValue
              currency={token}
              value={totalSupplied}
              disableRounding
              fontSize={3}
              showCode
              alwaysShowSign={false}
            />
          </LText>
        </View>
      </TouchableOpacity>
      <DelegationDrawer
        isOpen={isOpened}
        onClose={onCloseDrawer}
        account={account}
        icon={<CurrencyIcon size={62} radius={62} currency={currency} />}
        ValidatorImage={() => (
          <Circle size={62} bg={rgba(compoundColor, 0.2)}>
            <Compound size={62 * 0.55} />
          </Circle>
        )}
        amount={totalSupplied}
        data={data}
        actions={actions}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 8,
    height: 70,
  },
  currencySection: { paddingHorizontal: 8, flex: 1 },
  alignEnd: {
    alignItems: "flex-end",
  },
  title: {
    lineHeight: 17,
    fontSize: 14,
  },
  subTitle: {
    lineHeight: 15,
    fontSize: 12,
  },
  currencyIconContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  statusPill: {
    borderRadius: 20,
    height: 20,
    lineHeight: 20,
    fontSize: 10,
    paddingHorizontal: 8,
    textAlign: "center",
    textTransform: "uppercase",
  },
});
