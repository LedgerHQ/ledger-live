import React, { useCallback } from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { ListItem } from "@ledgerhq/lumen-ui-rnative";
import AccountItem from "LLM/features/Accounts/components/AccountItem";

type Props = Readonly<{
  account: AccountLike;
  onPress: (account: AccountLike) => void;
}>;

export default function CryptoAddressesListItem({ account, onPress }: Props) {
  const handlePress = useCallback(() => onPress(account), [account, onPress]);

  return (
    <ListItem onPress={handlePress}>
      <AccountItem account={account} balance={account.balance} withPlaceholder />
    </ListItem>
  );
}
