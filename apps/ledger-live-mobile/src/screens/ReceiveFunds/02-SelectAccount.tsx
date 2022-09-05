import React, { useCallback, useMemo, useState } from "react";
import { FlatList } from "react-native";
import { useSelector } from "react-redux";

import { Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { AccountLike } from "@ledgerhq/types-live";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { makeEmptyTokenAccount } from "@ledgerhq/live-common/account/index";
import { flattenAccountsByCryptoCurrencyScreenSelector } from "../../reducers/accounts";
import { ScreenName } from "../../const";
import { track, TrackScreen } from "../../analytics";
import AccountCard from "../../components/AccountCard";
import LText from "../../components/LText";

type Props = {
  navigation: any;
  route: { params?: { currency?: Currency } };
};

function ReceiveSelectAccount({ navigation, route }: Props) {
  const currency = route.params?.currency;
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const accounts = useSelector(
    flattenAccountsByCryptoCurrencyScreenSelector(currency),
  );
  const parentAccounts = useSelector(
    flattenAccountsByCryptoCurrencyScreenSelector(currency?.parentCurrency),
  );

  const aggregatedAccounts = useMemo(
    () =>
      currency.type === "TokenCurrency"
        ? parentAccounts.reduce((accs, pa) => {
            const tokenAccounts = pa.subAccounts
              ? pa.subAccounts.filter(
                  (acc: any) => acc.token.id === currency.id,
                )
              : [];

            if (tokenAccounts.length > 0) {
              accs.push(...tokenAccounts);
            } else {
              const tokenAcc = makeEmptyTokenAccount(pa, currency);
              tokenAcc.parentAccount = pa;
              tokenAcc.triggerCreateAccount = true;
              accs.push(tokenAcc);
            }

            return accs;
          }, [])
        : accounts,
    [accounts, currency, parentAccounts],
  );

  const selectAccount = useCallback(
    (account: AccountLike) => {
      if (!selectedAccount) {
        setSelectedAccount(account.id);
        track("account_clicked", {
          currency: currency.name,
        });
        navigation.navigate(ScreenName.ReceiveConfirmation, {
          ...route.params,
          accountId: account?.parentId || account.id,
          createTokenAccount: account?.triggerCreateAccount,
        });
      }
    },
    [currency.name, navigation, route.params, selectedAccount],
  );

  const renderItem = useCallback(
    ({ item: account }: { item: SearchResult }) => (
      <Flex px={6}>
        <AccountCard
          account={account}
          AccountSubTitle={
            account.parentAccount || account.token?.parentCurrency ? (
              <LText color="neutral.c70">
                {(account.parentAccount || account.token.parentCurrency).name}
              </LText>
            ) : null
          }
          onPress={() => selectAccount(account)}
        />
      </Flex>
    ),
    [selectAccount],
  );

  const keyExtractor = useCallback(item => item?.id, []);

  return aggregatedAccounts.length > 1 ? (
    <>
      <TrackScreen
        category="ReceiveFunds"
        name="Receive Account Select"
        currency={currency.name}
      />
      <Flex p={6}>
        <LText fontSize="32px" fontFamily="InterMedium" semiBold>
          {t("transfer.receive.selectAccount.title")}
        </LText>
        <LText variant="body" color="neutral.c70">
          {t("transfer.receive.selectAccount.subtitle", {
            currencyTicker: currency.ticker,
          })}
        </LText>
      </Flex>
      <FlatList
        data={aggregatedAccounts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
      />
    </>
  ) : null;
}

export default ReceiveSelectAccount;
