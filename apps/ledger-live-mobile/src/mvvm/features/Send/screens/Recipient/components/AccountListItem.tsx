import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import {
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
} from "@ledgerhq/lumen-ui-rnative";
import CurrencyIcon from "~/components/CurrencyIcon";
import { formatAddress } from "LLM/features/Accounts/utils/formatAddress";

type AccountListItemProps = Readonly<{
  account: Account;
  accountName: string;
  currency: CryptoOrTokenCurrency;
  onSelect: () => void;
}>;

export function AccountListItem({
  account,
  accountName,
  currency,
  onSelect,
}: AccountListItemProps) {
  const formattedAddress = useMemo(
    () => formatAddress(account.freshAddress),
    [account.freshAddress],
  );

  return (
    <ListItem onPress={onSelect}>
      <ListItemLeading>
        <View style={styles.iconContainer}>
          <CurrencyIcon currency={currency} size={32} />
        </View>
        <ListItemContent>
          <ListItemTitle>{accountName}</ListItemTitle>
          <ListItemDescription>{formattedAddress}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
