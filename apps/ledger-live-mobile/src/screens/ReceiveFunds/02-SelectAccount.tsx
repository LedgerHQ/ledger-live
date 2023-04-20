import React, { useCallback, useMemo, useState } from "react";
import { FlatList, ListRenderItemInfo } from "react-native";
import { useSelector } from "react-redux";

import { Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import {
  Account,
  AccountLike,
  SubAccount,
  TokenAccount,
} from "@ledgerhq/types-live";
import { makeEmptyTokenAccount } from "@ledgerhq/live-common/account/index";
import { flattenAccountsByCryptoCurrencyScreenSelector } from "../../reducers/accounts";
import { ScreenName } from "../../const";
import { track, TrackScreen } from "../../analytics";
import AccountCard from "../../components/AccountCard";
import LText from "../../components/LText";
import { ReceiveFundsStackParamList } from "../../components/RootNavigator/types/ReceiveFundsNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";

type SubAccountEnhanced = SubAccount & {
  parentAccount: Account;
  triggerCreateAccount: boolean;
};

function ReceiveSelectAccount({
  navigation,
  route,
}: StackNavigatorProps<
  ReceiveFundsStackParamList,
  ScreenName.ReceiveSelectAccount
>) {
  const currency = route?.params?.currency;
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

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
                  acc =>
                    acc.type === "TokenAccount" && acc.token.id === currency.id,
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
      if (!selectedAccount && currency) {
        setSelectedAccount(account.id);
        track("account_clicked", {
          currency: currency.name,
        });
        navigation.navigate(ScreenName.ReceiveConfirmation, {
          ...route.params,
          accountId: (account as SubAccountEnhanced)?.parentId || account.id,
          createTokenAccount: (account as SubAccountEnhanced)
            ?.triggerCreateAccount,
        });
      }
    },
    [currency, navigation, route.params, selectedAccount],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AccountLike>) => (
      <Flex px={6}>
        <AccountCard
          account={item}
          AccountSubTitle={
            (item as SubAccountEnhanced).parentAccount ||
            (item as TokenAccount).token?.parentCurrency ? (
              <LText color="neutral.c70">
                {
                  (
                    ((item as SubAccountEnhanced).parentAccount as Account) ||
                    (item as TokenAccount).token.parentCurrency
                  ).name
                }
              </LText>
            ) : null
          }
          onPress={() => selectAccount(item)}
        />
      </Flex>
    ),
    [selectAccount],
  );

  const keyExtractor = useCallback(item => item?.id, []);

  return currency && aggregatedAccounts && aggregatedAccounts.length > 1 ? (
    <>
      <TrackScreen
        category="ReceiveFunds"
        name="Receive Account Select"
        currency={currency.name}
      />
      <Flex p={6}>
        <LText
          fontSize="32px"
          fontFamily="InterMedium"
          semiBold
          testID="receive-header-step2-title"
        >
          {t("transfer.receive.selectAccount.title")}
        </LText>
        <LText variant="body" color="neutral.c70">
          {t("transfer.receive.selectAccount.subtitle", {
            currencyTicker: currency.ticker,
          })}
        </LText>
      </Flex>
      <FlatList
        testID="receive-header-step2-accounts"
        data={aggregatedAccounts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
      />
    </>
  ) : null;
}

export default ReceiveSelectAccount;
