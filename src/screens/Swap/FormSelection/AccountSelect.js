// @flow
import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";

import {
  getAccountCurrency,
  getAccountName,
} from "@ledgerhq/live-common/lib/account";

import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import type { SwapDataType } from "@ledgerhq/live-common/lib/exchange/swap/hooks";
import type { SwapRouteParams } from "..";

import SearchIcon from "../../../icons/Search";
import LText from "../../../components/LText";
import { ScreenName } from "../../../const";
import Chevron from "../../../icons/Chevron";
import CurrencyIcon from "../../../components/CurrencyIcon";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";

type Props = {
  navigation: *,
  route: { params: SwapRouteParams },
  swap: SwapDataType,
  setFromAccount: (account?: Account | TokenAccount) => void,
  providers: any,
  provider: any,
};

export default function AccountSelect({
  navigation,
  route,
  swap,
  setFromAccount,
  providers,
  provider,
}: Props) {
  const { colors } = useTheme();

  const value = swap.from.account;

  const currency = useMemo(() => value && getAccountCurrency(value), [value]);
  const name = useMemo(() => value && getAccountName(value), [value]);

  const onPressItem = useCallback(() => {
    navigation.navigate(ScreenName.SwapV2FormSelectAccount, {
      ...route.params,
      swap,
      setAccount: setFromAccount,
      target: "from",
      providers,
      provider,
      selectedCurrency: undefined,
    });
  }, [navigation, provider, providers, route.params, setFromAccount, swap]);

  return (
    <TouchableOpacity style={styles.root} onPress={onPressItem}>
      <View style={styles.root}>
        {value ? (
          <>
            <View style={styles.iconContainer}>
              <CurrencyIcon size={20} currency={currency} />
            </View>
            <View style={styles.accountColumn}>
              <View style={styles.labelContainer}>
                <LText semiBold style={styles.label} numberOfLines={1}>
                  {name}
                </LText>
                {currency.type === "TokenCurrency" &&
                currency.parentCurrency ? (
                  <LText
                    semiBold
                    style={[styles.currencyLabel, { borderColor: colors.grey }]}
                    color="grey"
                  >
                    {currency.parentCurrency.name}
                  </LText>
                ) : null}
              </View>

              <LText color="grey" style={styles.accountTicker}>
                <CurrencyUnitValue
                  showCode
                  unit={currency.units[0]}
                  value={value.balance}
                />
              </LText>
            </View>
          </>
        ) : (
          <>
            <View style={styles.iconContainer}>
              <SearchIcon size={16} color={colors.grey} />
            </View>
            <LText style={styles.label} color="grey">
              <Trans i18nKey={`transfer.swap.form.source`} />
            </LText>
          </>
        )}
      </View>
      <View style={styles.chevron}>
        <Chevron size={16} color={colors.grey} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
  },
  chevron: {
    marginLeft: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
  accountColumn: {
    flexDirection: "column",
    flex: 1,
  },
  accountTicker: {
    fontSize: 13,
    lineHeight: 16,
  },
  labelContainer: {
    flex: 0,
  },
  currencyLabel: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    textAlign: "right",
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    fontSize: 10,
    height: 24,
    lineHeight: 24,
    marginLeft: 12,
  },
});
