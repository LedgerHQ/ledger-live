import React, { useCallback, useMemo } from "react";
import { FlatList, ListRenderItemInfo } from "react-native";
import { useSelector } from "react-redux";

import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Account, SubAccount, TokenAccount } from "@ledgerhq/types-live";
import { makeEmptyTokenAccount } from "@ledgerhq/live-common/account/index";
import { flattenAccountsByCryptoCurrencyScreenSelector } from "~/reducers/accounts";
import { ScreenName } from "~/const";
import { track, TrackScreen } from "~/analytics";

import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AccountCard from "~/components/AccountCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { walletSelector } from "~/reducers/wallet";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { NetworkBasedAddAccountNavigator } from "LLM/features/Accounts/screens/AddAccount/types";

type SubAccountEnhanced = SubAccount & {
  parentAccount: Account;
  triggerCreateAccount: boolean;
};

type AccountLikeEnhanced = SubAccountEnhanced | Account | TokenAccount;

//TODO: (receive flow only) implement this in this ticket https://ledgerhq.atlassian.net/browse/LIVE-14640
/*type NavigationProps = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.ReceiveSelectAccount>
>;*/

function SelectAccount({
  route,
}: StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.SelectAccounts>) {
  const currency = route?.params?.currency;
  const { t } = useTranslation();
  //TODO: (receive flow only) implement this in this ticket https://ledgerhq.atlassian.net/browse/LIVE-14640
  //const navigationAccount = useNavigation<NavigationProps["navigation"]>();
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

  const selectAccount = useCallback((account: AccountLikeEnhanced) => {
    // TODO: implement this to support multiple and single selection of accounts (add account / receive)
    console.warn("selected account ", account); // TODO: remove this after the implementation in the next ticket
  }, []);

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
    /**
     * TODO: (receive flow only) implement this in this ticket https://ledgerhq.atlassian.net/browse/LIVE-14645
     * if (currency && currency.type === "TokenCurrency") {
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
     */
  }, []);

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
export default withDiscreetMode(SelectAccount);
