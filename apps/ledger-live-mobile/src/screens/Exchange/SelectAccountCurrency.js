// @flow

import { isAccountEmpty } from "@ledgerhq/live-common/lib/account";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account/helpers";
import type {
  Account,
  AccountLike,
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { useNavigation, useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import { track } from "../../analytics";
import AccountCard from "../../components/AccountCard";
import Button from "../../components/Button";
import CurrencyRow from "../../components/CurrencyRow";
import LText from "../../components/LText";
import { NavigatorName, ScreenName } from "../../const";
import DropdownArrow from "../../icons/DropdownArrow";
import { accountsSelector } from "../../reducers/accounts";
import { useCurrencyAccountSelect } from "./hooks";

type Props = {
  flow: string,
  allCurrencies: Array<TokenCurrency | CryptoCurrency>,
  defaultCurrencyId?: ?string,
  defaultAccountId?: ?string,
};

export default function SelectAccountCurrency({
  flow,
  allCurrencies,
  defaultCurrencyId,
  defaultAccountId,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const allAccounts = useSelector(accountsSelector);
  const {
    availableAccounts,
    currency,
    account,
    subAccount,
    setAccount,
    setCurrency,
  } = useCurrencyAccountSelect({
    allCurrencies: allCurrencies || [],
    allAccounts,
    defaultCurrencyId,
    defaultAccountId,
  });

  const onCurrencyChange = useCallback(
    (selectedCurrency: CryptoCurrency | TokenCurrency) => {
      setCurrency(selectedCurrency);
    },
    [setCurrency],
  );

  const onAccountChange = useCallback(
    (selectedAccount: Account | AccountLike) => {
      setAccount(selectedAccount);
    },
    [setAccount],
  );

  const onSelectCurrency = useCallback(() => {
    navigation.navigate(NavigatorName.ExchangeStack, {
      screen: ScreenName.ExchangeSelectCurrency,
      params: {
        mode: flow,
        onCurrencyChange,
      },
    });
  }, [navigation, flow, onCurrencyChange]);

  const onSelectAccount = useCallback(() => {
    navigation.navigate(NavigatorName.ExchangeStack, {
      screen: ScreenName.ExchangeSelectAccount,
      params: {
        currency,
        mode: flow,
        onAccountChange,
      },
    });
  }, [navigation, currency, flow, onAccountChange]);

  const onContinue = useCallback(() => {
    if (account) {
      navigation.navigate(NavigatorName.ProviderList, {
        accountId: account.id,
        accountAddress: account.freshAddress,
        currency,
        type: flow === "buy" ? "onRamp" : "offRamp",
      });

      track(
        `${flow.charAt(0).toUpperCase()}${flow.slice(
          1,
        )} Crypto Continue Button`,
        {
          currencyName: getAccountCurrency(account).name,
          isEmpty: isAccountEmpty(account),
        },
      );
    }
  }, [account, currency, flow, navigation]);

  const onAddAccount = useCallback(() => {
    if (currency && currency.type === "TokenCurrency") {
      navigation.navigate(NavigatorName.AddAccounts, {
        token: currency,
        analyticsPropertyFlow: flow,
      });
    } else {
      navigation.navigate(NavigatorName.AddAccounts, {
        currency,
        analyticsPropertyFlow: flow,
      });
    }
  }, [currency, flow, navigation]);

  return (
    <View style={styles.body}>
      <View
        style={[
          styles.accountAndCurrencySelect,
          { borderColor: colors.border },
        ]}
      >
        <LText secondary semiBold>
          {flow === "buy"
            ? t("exchange.buy.wantToBuy")
            : t("exchange.sell.wantToSell")}
        </LText>
        <TouchableOpacity onPress={onSelectCurrency}>
          <View style={[styles.select, { borderColor: colors.border }]}>
            <View style={styles.name}>
              {currency ? (
                <View>
                  <CurrencyRow
                    currency={currency}
                    onPress={() => {}}
                    iconSize={32}
                  />
                </View>
              ) : (
                <LText style={styles.placeholder}>
                  {t("exchange.buy.selectCurrency")}
                </LText>
              )}
            </View>
            <DropdownArrow size={10} color={colors.grey} />
          </View>
        </TouchableOpacity>
        {availableAccounts.length > 0 && (
          <>
            <LText secondary semiBold style={styles.itemMargin}>
              {t("exchange.buy.selectAccount")}
            </LText>
            <TouchableOpacity onPress={onSelectAccount}>
              <View style={[styles.select, { borderColor: colors.border }]}>
                {account || subAccount ? (
                  <AccountCard
                    style={styles.card}
                    account={subAccount || account}
                  />
                ) : (
                  <LText style={styles.placeholder}>
                    {t("exchange.buy.selectAccount")}
                  </LText>
                )}
                <DropdownArrow size={10} color={colors.grey} />
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>
      <View
        style={[
          styles.footer,
          {
            ...Platform.select({
              android: {
                borderTopColor: "rgba(20, 37, 51, 0.1)",
                borderTopWidth: 1,
              },
              ios: {
                shadowColor: "rgb(20, 37, 51)",
                shadowRadius: 14,
                shadowOpacity: 0.04,
                shadowOffset: {
                  width: 0,
                  height: -4,
                },
              },
            }),
          },
        ]}
      >
        {account ? (
          <Button
            containerStyle={styles.button}
            type={"primary"}
            title={t("common.continue")}
            onPress={onContinue}
          />
        ) : (
          <Button
            containerStyle={styles.button}
            type={"primary"}
            title={t("exchange.buy.emptyState.CTAButton")}
            onPress={onAddAccount}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  accountAndCurrencySelect: {
    width: "100%",
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  select: {
    height: 56,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 120,
    paddingVertical: 14,
    marginTop: 12,
    paddingRight: 16,
  },
  name: {
    flex: 1,
  },
  itemMargin: {
    marginTop: 40,
  },
  placeholder: {
    marginLeft: 16,
  },
  card: {
    maxWidth: "100%",
    paddingVertical: -16,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  footer: {
    paddingVertical: 16,
  },
  button: {
    alignSelf: "stretch",
    minWidth: "100%",
  },
});
