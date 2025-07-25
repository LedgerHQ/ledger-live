import React from "react";
import { FlatList, TouchableOpacity } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Account } from "@ledgerhq/types-live";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { Observable } from "rxjs";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useDetailedAccounts } from "../../hooks/useDetailedAccounts";

export type AccountSelectionStepProps = {
  accounts$?: Observable<WalletAPIAccount[]>;
  onAccountSelected: ((account: Account) => void) | undefined;
  asset?: CryptoOrTokenCurrency;
};

const AccountSelection = ({
  accounts$,
  onAccountSelected,
  asset,
}: Readonly<AccountSelectionStepProps>) => {
  const { accounts } = useDetailedAccounts(asset!, accounts$);

  const renderItem = ({ item }: { item: Account }) => {
    return (
      <TouchableOpacity onPress={() => onAccountSelected?.(item as unknown as Account)}>
        <Flex p={4} borderBottomWidth={1} borderBottomColor="neutral.c30">
          <Text variant="small" color="neutral.c70">
            {item.id}
          </Text>
          <Text variant="small" color="neutral.c70">
            {item.freshAddress}
          </Text>
        </Flex>
      </TouchableOpacity>
    );
  };

  const keyExtractor = (item: Account) => item.id;

  const accs = accounts.map(({ account }) => account);

  return (
    <FlatList
      data={accs}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default React.memo(AccountSelection);
