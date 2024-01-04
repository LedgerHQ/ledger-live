import React, { useCallback, useMemo } from "react";
import { FlatList, ListRenderItemInfo } from "react-native";
import { useSelector } from "react-redux";

import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Account, AccountLike, SubAccount, TokenAccount } from "@ledgerhq/types-live";
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

type SubAccountEnhanced = SubAccount & {
  parentAccount: Account;
  triggerCreateAccount: boolean;
};

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
        ? parentAccounts!.reduce<AccountLike[]>((accs, pa) => {
            const tokenAccounts = (pa as Account).subAccounts
              ? (pa as Account).subAccounts?.filter(
                  acc => acc.type === "TokenAccount" && acc.token.id === currency.id,
                )
              : [];

            if (tokenAccounts && tokenAccounts.length > 0) {
              accs.push(...tokenAccounts);
            } else {
              const tokenAcc = makeEmptyTokenAccount(pa as Account, currency);

              const tokenA: SubAccountEnhanced = {
                ...tokenAcc,
                parentAccount: pa as Account,
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
    (account: AccountLike) => {
      if (currency) {
        track("account_clicked", {
          asset: currency.name,
          page: "Select account to deposit to",
        });
        navigation.navigate(ScreenName.ReceiveConfirmation, {
          ...route.params,
          accountId: (account as SubAccountEnhanced)?.parentId || account.id,
          createTokenAccount: (account as SubAccountEnhanced)?.triggerCreateAccount,
        });
      }
    },
    [currency, navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AccountLike>) => (
      <Flex px={6}>
        <AccountCard
          account={item}
          AccountSubTitle={
            (item as SubAccountEnhanced).parentAccount ||
            (item as TokenAccount).token?.parentCurrency ? (
              <Text color="neutral.c80">
                {
                  (
                    ((item as SubAccountEnhanced).parentAccount as Account) ||
                    (item as TokenAccount).token.parentCurrency
                  ).name
                }
              </Text>
            ) : null
          }
          onPress={() => selectAccount(item)}
        />
      </Flex>
    ),
    [selectAccount],
  );

  const createNewAccount = useCallback(() => {
    track("button_clicked", {
      button: "Create a new account",
      page: "Select account to deposit to",
    });
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
  }, [currency, navigationAccount]);

  const keyExtractor = useCallback((item: AccountLike) => item?.id, []);

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
