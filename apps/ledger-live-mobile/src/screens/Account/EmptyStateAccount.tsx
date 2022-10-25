import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/currencies/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { getAllSupportedCryptoCurrencyIds } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import { ScreenName, NavigatorName } from "../../const";

import LText from "../../components/LText";
import Button from "../../components/Button";
import Receive from "../../icons/Receive";
import Exchange from "../../icons/Exchange";
import EmptyStateAccountIllu from "../../images/EmptyStateAccount";

import { Theme, withTheme } from "../../colors";
import { BaseNavigation } from "../../components/RootNavigator/types/helpers";

type Props = {
  account: AccountLike;
  parentAccount?: Account;
  navigation: BaseNavigation;
  colors: Theme["colors"];
};

function EmptyStateAccount({
  account,
  parentAccount,
  navigation,
  colors,
}: Props) {
  const mainAccount = getMainAccount(account, parentAccount);
  const hasSubAccounts = Array.isArray(mainAccount.subAccounts);
  const isToken =
    listTokenTypesForCryptoCurrency(mainAccount.currency).length > 0;
  const currency = getAccountCurrency(account);
  const rampCatalog = useRampCatalog();

  const canBeBought = useMemo(() => {
    if (!rampCatalog.value) {
      return false;
    }

    const allBuyableCryptoCurrencyIds = getAllSupportedCryptoCurrencyIds(
      rampCatalog.value.onRamp,
    );

    return allBuyableCryptoCurrencyIds.includes(currency.id);
  }, [rampCatalog.value, currency.id]);

  const goToReceiveFunds = useCallback(() => {
    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: {
        accountId: account.id,
        parentId: parentAccount && parentAccount.id,
      },
    });
  }, [navigation, account, parentAccount]);

  const goToBuyCrypto = useCallback(() => {
    navigation.navigate(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
      params: {
        defaultCurrencyId: currency.id,
        defaultAccountId: account.id,
        parentId: parentAccount && parentAccount.id,
      },
    });
  }, [navigation, currency.id, account.id, parentAccount]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.body}>
        <View style={styles.illustration}>
          <EmptyStateAccountIllu />
        </View>

        <LText secondary semiBold style={styles.title}>
          <Trans i18nKey="account.emptyState.title" />
        </LText>
        <LText style={styles.desc} color="grey">
          {hasSubAccounts && isToken ? (
            <Trans i18nKey="account.emptyState.descToken">
              {"Make sure the"}
              <LText semiBold color="darkBlue">
                {mainAccount.currency.managerAppName}
              </LText>
              {"app is installed and start receiving"}
              <LText semiBold color="darkBlue">
                {mainAccount.currency.ticker}
              </LText>
              {"and"}
              <LText semiBold color="darkBlue">
                {account &&
                  (account as Account).currency &&
                  listTokenTypesForCryptoCurrency(mainAccount.currency).join(
                    ", ",
                  )}
                {"tokens"}
              </LText>
            </Trans>
          ) : canBeBought ? (
            <Trans i18nKey="account.emptyState.descWithBuy">
              {"Make sure the"}
              <LText semiBold color="darkBlue">
                {mainAccount.currency.managerAppName}
              </LText>
              {"app is installed so you can buy or receive"}
              <LText semiBold color="darkBlue">
                {currency.ticker}
              </LText>
            </Trans>
          ) : (
            <Trans i18nKey="account.emptyState.desc">
              {"Make sure the"}
              <LText semiBold color="darkBlue">
                {mainAccount.currency.managerAppName}
              </LText>
              {"app is installed and start receiving"}
            </Trans>
          )}
        </LText>
        <View style={styles.buttonContainer}>
          <Button
            event="AccountEmptyStateReceive"
            type="primary"
            title={<Trans i18nKey="account.emptyState.buttons.receiveFunds" />}
            onPress={goToReceiveFunds}
            IconLeft={Receive}
          />
          {canBeBought && (
            <Button
              event="Buy Crypto Empty Account Button"
              eventProperties={{
                currencyName: getAccountCurrency(account).name,
              }}
              type="primary"
              title={<Trans i18nKey="account.emptyState.buttons.buyCrypto" />}
              onPress={goToBuyCrypto}
              containerStyle={styles.buyButton}
              IconLeft={Exchange}
            />
          )}
        </View>
      </View>
    </View>
  );
}

export default withTheme(EmptyStateAccount);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    margin: 16,
    flexDirection: "column",
    justifyContent: "center",
    paddingVertical: "40%",
  },
  illustration: { width: "100%", height: 60 },
  body: {
    alignItems: "center",
  },
  buyButton: {
    marginLeft: 4,
  },
  title: {
    marginTop: 32,
    marginBottom: 16,
    fontSize: 16,
    textAlign: "center",
  },
  desc: {
    marginHorizontal: 24,
    textAlign: "center",
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: "row",
  },
});
