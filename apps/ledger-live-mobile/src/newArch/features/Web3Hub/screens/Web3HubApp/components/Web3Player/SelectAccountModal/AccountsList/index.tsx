import React from "react";
import { StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { isAccount } from "@ledgerhq/live-common/account/index";
import { FlashList } from "@shopify/flash-list";
import { accountsByCryptoCurrencyScreenSelector } from "~/reducers/accounts";
import AccountCard from "~/components/AccountCard";
import AddAccountItem from "./AddAccountItem";

type AccountTuple = {
  account: AccountLike;
  subAccount: TokenAccount | null;
  name: string;
};

const accountKeyExtractor = (item: AccountTuple) => item.subAccount?.id || item.account.id;

const noop = () => {};

const renderAccountItem = ({
  item,
  extraData = noop,
}: {
  item: AccountTuple;
  extraData?: (account: AccountLike) => void;
}) => {
  const account = item.subAccount || item.account;
  const parentAccount = item.subAccount && isAccount(item.account) ? item.account : undefined;

  return (
    <AccountCard
      account={account}
      parentAccount={parentAccount}
      style={styles.accountCard}
      iconSize={50}
      // Cannot use useCallback as we are not in a component
      onPress={() => {
        extraData(account);
      }}
    />
  );
};

export default function AccountsList({
  currency,
  onPressItem,
  onAddAccount,
}: {
  currency: CryptoCurrency;
  onPressItem: (account: AccountLike) => void;
  onAddAccount: () => void;
}) {
  const accounts = useSelector(accountsByCryptoCurrencyScreenSelector(currency));

  return (
    <FlashList
      contentContainerStyle={styles.list}
      testID="web3hub-select-account"
      ListHeaderComponent={<AddAccountItem onPress={onAddAccount} />}
      keyExtractor={accountKeyExtractor}
      renderItem={renderAccountItem}
      estimatedItemSize={60}
      data={accounts}
      extraData={onPressItem}
    />
  );
}

const styles = StyleSheet.create({
  accountCard: {
    paddingHorizontal: 16,
  },
  list: {
    paddingBottom: 16,
  },
});
