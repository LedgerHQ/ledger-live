import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import {
  accountWithMandatoryTokens,
  flattenAccounts,
} from "@ledgerhq/live-common/lib/account/helpers";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import { Flex, Text } from "@ledgerhq/native-ui";
import { ScreenName } from "../const";
import { accountsSelector } from "../reducers/accounts";
import ReceiveAccountCard from "../components/ReceiveAccountCard";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types/account";

type Props = {
  navigation: any;
  route: {
    params: {
      selectedCurrency: CryptoCurrency | TokenCurrency;
    };
  };
};

export default function SelectAccount({ navigation, route }: Props) {
  const { selectedCurrency } = route.params;

  const { t } = useTranslation();
  const allAccounts = useSelector(accountsSelector);
  const currencyAccounts = useMemo(() => {
    if (selectedCurrency) {
      const filteredAccounts = allAccounts.filter(
        acc =>
          acc.currency.id ===
          (selectedCurrency.type === "TokenCurrency"
            ? selectedCurrency.parentCurrency.id
            : selectedCurrency.id),
      );
      if (selectedCurrency.type === "TokenCurrency") {
        // add in the token subAccount if it does not exist
        return flattenAccounts(
          filteredAccounts.map(acc =>
            accountWithMandatoryTokens(acc, [selectedCurrency]),
          ),
        ).filter(
          acc =>
            acc.type === "Account" ||
            (acc.type === "TokenAccount" &&
              acc.token.id === selectedCurrency.id),
        );
      }
      return flattenAccounts(filteredAccounts);
    }
    return flattenAccounts(allAccounts);
  }, [allAccounts, selectedCurrency]);

  const keyExtractor = (item: Account) => item.id;
  
  const onSelectAccount = useCallback(
    account => {
      navigation.navigate(ScreenName.ReceiveConnectDevice, {
        account,
        accountId: account.id,
        parentId: account.type !== "Account" ? account.parentId : undefined,
      });
    },
    [navigation],
  );

  const renderItem = ({ item }: { item: AccountLike }) => (
      <ReceiveAccountCard
        account={item}
        onPress={() => onSelectAccount(item)}
      />
  );

  return (
    <Flex flex={1} color="background.main" px={6} py={3}>
      <Text color="neutral.c100" fontWeight="medium" variant="h4">
        {t("transfer.receive.selectAccount.title")}
      </Text>
      <Text
        color="neutral.c80"
        fontWeight="medium"
        variant="bodyLineHeight"
        mt={2}
        mb={6}
      >
        {t("transfer.receive.selectAccount.subtitle", { currencyTicker: selectedCurrency.ticker})}
      </Text>
      <FlatList
        data={currencyAccounts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      />
    </Flex>
  );
}
