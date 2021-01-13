// @flow

import { getAccountName } from "@ledgerhq/live-common/lib/account";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";
import type {
  Account,
  AccountLike,
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { BigNumber } from "bignumber.js";
import React, { useCallback } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { ScreenName } from "../../const";
import CounterValue from "../CounterValue";
import CurrencyUnitValue from "../CurrencyUnitValue";
import { accountsSelector } from "../../reducers/accounts";
import LText from "../LText";
import ParentCurrencyIcon from "../ParentCurrencyIcon";
import { ensureContrast } from "../../colors";

export type AccountDistributionItem = {
  account: AccountLike,
  distribution: number, // % of the total (normalized in 0-1)
  amount: BigNumber,
  currency: CryptoCurrency | TokenCurrency,
};

type Props = {
  item: AccountDistributionItem,
};

export default function Row({
  item: { currency, distribution, account, amount },
}: Props) {
  const accounts = useSelector(accountsSelector);
  const navigation = useNavigation();
  const { colors } = useTheme();

  const onAccountPress = useCallback(
    (parentAccount?: ?Account) => {
      navigation.navigate(ScreenName.Account, {
        accountId: account.id,
        parentId: parentAccount ? parentAccount.id : undefined,
      });
    },
    [account.id, navigation],
  );

  const parentAccount =
    account.type !== "Account"
      ? accounts.find(a => a.id === account.parentId)
      : null;
  const color = ensureContrast(getCurrencyColor(currency), colors.background);
  const percentage = Math.round(distribution * 1e4) / 1e2;
  const icon = <ParentCurrencyIcon currency={currency} size={18} />;

  return (
    <RectButton
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          ...Platform.select({
            android: {},
            ios: {
              shadowColor: colors.black,
            },
          }),
        },
      ]}
      onPress={() => onAccountPress(parentAccount)}
    >
      {icon}
      <View style={styles.content}>
        <View style={styles.row}>
          <LText
            numberOfLines={1}
            semiBold
            style={[styles.darkBlue, styles.bodyLeft]}
          >
            {getAccountName(account)}
          </LText>
          <LText semiBold style={[styles.darkBlue, styles.bodyRight]}>
            <CurrencyUnitValue unit={currency.units[0]} value={amount} />
          </LText>
        </View>
        <View style={styles.row}>
          <View />
          <LText semiBold style={styles.counterValue} color="grey">
            <CounterValue currency={currency} value={amount} />
          </LText>
        </View>
        <View style={[styles.row, { marginTop: 16 }]}>
          <View style={[styles.progress, { backgroundColor: colors.lightFog }]}>
            <View
              style={[
                styles.progress,
                {
                  flex: 0,
                  backgroundColor: color,
                  width: `${percentage}%`,
                },
              ]}
            />
          </View>
          <LText
            semiBold
            style={styles.percentageText}
          >{`${percentage}%`}</LText>
        </View>
      </View>
    </RectButton>
  );
}

const styles = StyleSheet.create({
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  card: {
    display: "flex",
    padding: 16,
    flexDirection: "row",
    marginBottom: 8,

    borderRadius: 4,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
  content: {
    display: "flex",
    flex: 1,
    marginLeft: 16,
  },
  progress: {
    height: 6,
    borderRadius: 3,
    flex: 1,
  },
  darkBlue: {
    fontSize: 14,
    lineHeight: 21,
  },
  percentageText: {
    marginLeft: 16,
  },
  counterValue: {
    fontSize: 12,
    lineHeight: 18,
  },
  bodyLeft: {
    flexGrow: 1,
    flexShrink: 1,
    height: 20,
  },
  bodyRight: {
    paddingLeft: 4,
  },
});
