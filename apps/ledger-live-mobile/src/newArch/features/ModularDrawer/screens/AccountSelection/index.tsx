import React from "react";
import { FlatList, TouchableOpacity } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { AccountLike } from "@ledgerhq/types-live";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { Observable } from "rxjs";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useDetailedAccounts } from "../../hooks/useDetailedAccounts";
import { AccountTuple } from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";

export type AccountSelectionStepProps = {
  accounts$?: Observable<WalletAPIAccount[]>;
  onAccountSelected?: (account: AccountLike, parentAccount?: AccountLike) => void;
  asset?: CryptoOrTokenCurrency;
};

const AccountSelection = ({
  accounts$,
  onAccountSelected,
  asset,
}: Readonly<AccountSelectionStepProps>) => {
  const { accounts } = useDetailedAccounts(asset!, accounts$);

  const handleAccountSelected = (accountTuple: AccountTuple) => {
    const { account, subAccount } = accountTuple;

    if (subAccount) {
      // If we have a subAccount, pass it as the selected account and the main account as parent
      onAccountSelected?.(subAccount, account);
    } else {
      // If no subAccount, pass the main account with no parent
      onAccountSelected?.(account, undefined);
    }
  };

  const renderItem = ({ item }: { item: AccountTuple }) => {
    const { account, subAccount } = item;
    const displayAccount = subAccount || account;

    return (
      <TouchableOpacity onPress={() => handleAccountSelected(item)}>
        <Flex p={4} borderBottomWidth={1} borderBottomColor="neutral.c30">
          <Text variant="small" color="neutral.c70">
            {displayAccount.id}
          </Text>
          <Text variant="small" color="neutral.c70">
            {displayAccount.type === "Account"
              ? displayAccount.freshAddress
              : displayAccount.token.ticker}
          </Text>
        </Flex>
      </TouchableOpacity>
    );
  };

  const keyExtractor = (item: AccountTuple) => item.subAccount?.id || item.account.id;

  return (
    <FlatList
      data={accounts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default React.memo(AccountSelection);
