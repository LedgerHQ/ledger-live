import React, { useCallback, useMemo } from "react";
import { FlatList, ListRenderItemInfo } from "react-native";
import { useSelector } from "react-redux";

import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Account, SubAccount, TokenAccount } from "@ledgerhq/types-live";
import { makeEmptyTokenAccount } from "@ledgerhq/live-common/account/index";
import { flattenAccountsByCryptoCurrencyScreenSelector } from "~/reducers/accounts";
import { NavigatorName, ScreenName } from "~/const";
import { track, TrackScreen } from "~/analytics";

import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AccountCard from "~/components/AccountCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import { useNavigation } from "@react-navigation/core";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { walletSelector } from "~/reducers/wallet";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

type SubAccountEnhanced = SubAccount & {
  parentAccount: Account;
  triggerCreateAccount: boolean;
};

type AccountLikeEnhanced = SubAccountEnhanced | Account | TokenAccount;

type NavigationProps = BaseComposite<
  StackNavigatorProps<AccountsNavigatorParamList, ScreenName.ReceiveSelectAccount>
>;

function ReceiveSelectAccount({
  navigation,
  route,
}: StackNavigatorProps<
  ReceiveFundsStackParamList & AccountsNavigatorParamList,
  ScreenName.ReceiveSelectAccount
>) {
  const currency = route?.params?.currency;

  const { t } = useTranslation();
  const navigationAccount = useNavigation<NavigationProps["navigation"]>();
  const insets = useSafeAreaInsets();
  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");
  const accounts = useSelector(
    currency && currency.type === "CryptoCurrency"
      ? flattenAccountsByCryptoCurrencyScreenSelector(currency)
      : () => null,
  );
  const parentAccounts = useSelector(
    currency && currency.type === "TokenCurrency"
      ? flattenAccountsByCryptoCurrencyScreenSelector(currency?.parentCurrency)
      : () => null,
  );

  const aggregatedAccounts = useMemo(
    () =>
      currency && currency.type === "TokenCurrency"
        ? parentAccounts!.reduce<AccountLikeEnhanced[]>((accs, pa) => {
            const tokenAccounts =
              pa.type === "Account" && pa.subAccounts
                ? pa.subAccounts?.filter(
                    acc => acc.type === "TokenAccount" && acc.token.id === currency.id,
                  )
                : [];

            if (tokenAccounts && tokenAccounts.length > 0) {
              accs.push(...tokenAccounts);
            } else if (pa.type === "Account") {
              const tokenAcc = makeEmptyTokenAccount(pa, currency);

              const tokenA: SubAccountEnhanced = {
                ...tokenAcc,
                parentAccount: pa,
                triggerCreateAccount: true,
              };

              accs.push(tokenA);
            }

            return accs;
          }, [])
        : accounts,
    [accounts, currency, parentAccounts],
  );

  const selectAccount = useCallback(
    (account: AccountLikeEnhanced) => {
      if (currency) {
        track("account_clicked", {
          asset: currency.name,
          page: "Select account to deposit to",
        });
        navigation.navigate(ScreenName.ReceiveConfirmation, {
          ...route.params,
          accountId: (account.type !== "Account" && account?.parentId) || account.id,
          createTokenAccount: "triggerCreateAccount" in account && account?.triggerCreateAccount,
        });
      }
    },
    [currency, navigation, route.params],
  );

  const walletState = useSelector(walletSelector);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AccountLikeEnhanced>) => (
      <Flex px={6}>
        <AccountCard
          account={item}
          AccountSubTitle={
            <Text color="neutral.c80">{accountNameWithDefaultSelector(walletState, item)}</Text>
          }
          onPress={() => selectAccount(item)}
        />
      </Flex>
    ),
    [walletState, selectAccount],
  );

  const createNewAccount = useCallback(() => {
    track("button_clicked", {
      button: "Create a new account",
      page: "Select account to deposit to",
    });

    if (llmNetworkBasedAddAccountFlow?.enabled) {
      navigationAccount.navigate(NavigatorName.AssetSelection, {
        ...(currency && currency.type === "TokenCurrency"
          ? { token: currency.id }
          : { currency: currency.id }),
        context: "addAccounts",
      });
    } else {
      if (currency && currency.type === "TokenCurrency") {
        navigationAccount.navigate(NavigatorName.AddAccounts, {
          screen: undefined,
          params: {
            token: currency,
          },
        });
      } else {
        navigationAccount.navigate(NavigatorName.AddAccounts, {
          screen: undefined,
          currency,
        });
      }
    }
  }, [currency, navigationAccount, llmNetworkBasedAddAccountFlow?.enabled]);

  const keyExtractor = useCallback((item: AccountLikeEnhanced) => item?.id, []);

  return currency && aggregatedAccounts && aggregatedAccounts.length > 0 ? (
    <>
      <TrackScreen category="Deposit" name="Select account to deposit to" asset={currency.name} />
      <Flex p={6}>
        <Text
          variant="h4"
          testID="receive-header-step2-title"
          fontSize="24px"
          color="neutral.c100"
          mb={2}
        >
          {t("transfer.receive.selectAccount.title")}
        </Text>
        <Text variant="bodyLineHeight" color="neutral.c80">
          {t("transfer.receive.selectAccount.subtitle", {
            currencyTicker: currency.ticker,
          })}
        </Text>
      </Flex>
      <FlatList
        testID="receive-header-step2-accounts"
        data={aggregatedAccounts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
      />

      <Flex mb={insets.bottom + 2} px={6}>
        <Button
          type="shade"
          size="large"
          outline
          onPress={createNewAccount}
          testID="button-create-account"
        >
          {t("transfer.receive.selectAccount.cta")}
        </Button>
      </Flex>
    </>
  ) : null;
}
export default withDiscreetMode(ReceiveSelectAccount);
