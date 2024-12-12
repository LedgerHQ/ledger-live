import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { StyleSheet, View, SafeAreaView } from "react-native";
import { useSelector } from "react-redux";
import { findTokenAccountByCurrency } from "@ledgerhq/live-common/account/index";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { accountsSelector } from "~/reducers/accounts";
import CurrencyIcon from "~/components/CurrencyIcon";
import Button from "~/components/Button";
import Alert from "~/components/Alert";
import LText from "~/components/LText";
import { urls } from "~/utils/urls";
import { ScreenName, NavigatorName } from "~/const";
import { TrackScreen } from "~/analytics";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { AssetSelectionNavigatorParamsList } from "../../types";

type Props = CompositeScreenProps<
  StackNavigatorProps<
    AssetSelectionNavigatorParamsList,
    ScreenName.AddAccountsTokenCurrencyDisclaimer
  >,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function TokenCurrencyDisclaimer({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const accounts = useSelector(accountsSelector);
  const token = route.params.token;
  const tokenName = `${token.name} (${token.ticker})`;
  const parentCurrency = token.parentCurrency;
  const accountData = findTokenAccountByCurrency(token, accounts);
  const parentTokenAccount = accountData ? accountData.parentAccount : null;
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);
  // specific cta in case of token accounts
  const onTokenCta = useCallback(() => {
    if (parentTokenAccount && parentTokenAccount.type === "Account") {
      onClose();
      navigation.navigate(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveConfirmation,
        params: {
          // prefilter with token curency
          accountId: parentTokenAccount.id,
          currency: token,
          createTokenAccount: true,
        },
      });
    } else {
      // set parentCurrency in already opened add account flow and continue
      navigation.navigate(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          ...route.params,
          currency: parentCurrency,
        },
      });
    }
  }, [parentTokenAccount, onClose, navigation, token, route.params, parentCurrency]);
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
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
            learnMoreUrl={
              urls.supportLinkByTokenType[
                token.tokenType as keyof typeof urls.supportLinkByTokenType
              ]
            }
            learnMoreKey={`addAccounts.tokens.generic.learnMore`}
            learnMoreTransValues={{
              tokenType: token.tokenType.toUpperCase(),
            }}
          >
            <Trans
              i18nKey={`addAccounts.tokens.generic.disclaimer`}
              values={{
                token: token.name,
                ticker: token.ticker,
                tokenType: token.tokenType.toUpperCase(),
                currency: token.parentCurrency.name,
              }}
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
