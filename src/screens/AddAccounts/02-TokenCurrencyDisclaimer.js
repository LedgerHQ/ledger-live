// @flow

import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { StyleSheet, View, SafeAreaView } from "react-native";
import { useSelector } from "react-redux";

import type { TokenCurrency } from "@ledgerhq/live-common/lib/types";

import { findTokenAccountByCurrency } from "@ledgerhq/live-common/lib/account";
import { useTheme } from "@react-navigation/native";
import { accountsSelector } from "../../reducers/accounts";

import CurrencyIcon from "../../components/CurrencyIcon";
import Button from "../../components/Button";
import Alert from "../../components/Alert";
import LText from "../../components/LText";
import { urls } from "../../config/urls";
import { ScreenName, NavigatorName } from "../../const";
import { TrackScreen } from "../../analytics";

type RouteParams = {
  token: TokenCurrency,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

export default function AddAccountsTokenCurrencyDisclaimer({
  navigation,
  route,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const accounts = useSelector(accountsSelector);

  const token = route.params.token;
  const tokenName = `${token.name} (${token.ticker})`;

  const parentCurrency = token.parentCurrency;

  const accountData = findTokenAccountByCurrency(token, accounts);

  const parentTokenAccount = accountData ? accountData.parentAccount : null;

  const onClose = useCallback(() => {
    navigation.dangerouslyGetParent().pop();
  }, [navigation]);

  // specific cta in case of token accounts
  const onTokenCta = useCallback(() => {
    if (parentTokenAccount && parentTokenAccount.type === "Account") {
      onClose();
      navigation.navigate(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveSelectAccount,
        params: {
          // prefilter with token curency
          selectedCurrency: token,
        },
      });
    } else {
      // set parentCurrency in already opened add account flow and continue
      navigation.navigate(ScreenName.AddAccountsSelectDevice, {
        ...route.params,
        currency: parentCurrency,
      });
    }
  }, [
    parentTokenAccount,
    onClose,
    navigation,
    token,
    route.params,
    parentCurrency,
  ]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <TrackScreen
          category="AddAccounts"
          name="TokenCurrencyDisclaimer"
          currencyName={tokenName}
        />
        <View style={styles.wrapper}>
          <CurrencyIcon size={56} radius={16} currency={token} />
        </View>
        <View style={[styles.wrapper, styles.spacer]}>
          <LText secondary bold style={styles.tokenName}>
            {tokenName}
          </LText>
        </View>
        <View style={styles.disclaimerWrapper}>
          <Alert
            type="primary"
            learnMoreUrl={urls.supportLinkByTokenType[token.tokenType]}
            learnMoreKey={`addAccounts.tokens.${token.tokenType}.learnMore`}
          >
            <Trans
              i18nKey={`addAccounts.tokens.${token.tokenType}.disclaimer`}
              values={{ tokenName }}
            />
          </Alert>
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            event="AddAccountTokenDisclaimerClose"
            title={t("common.close")}
            type="secondary"
            onPress={onClose}
            containerStyle={[styles.buttonSpace]}
          />
          <Button
            event="AddAccountTokenDisclaimerBack"
            title={
              parentTokenAccount
                ? t("account.receive")
                : t("addAccounts.tokens.createParentCurrencyAccount", {
                    parrentCurrencyName: token.parentCurrency.ticker,
                  })
            }
            type="primary"
            onPress={onTokenCta}
            containerStyle={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 32,
  },
  wrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  spacer: {
    paddingTop: 16,
  },
  tokenName: {
    fontSize: 18,
  },
  buttonWrapper: {
    flexDirection: "row",
  },
  button: {
    flex: 1,
  },
  buttonSpace: {
    marginRight: 16,
    flex: 0.5,
  },
  disclaimerWrapper: {
    flex: 1,
    paddingTop: 32,
  },
});
