import React, { memo, useCallback } from "react";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import type { Account } from "@ledgerhq/types-live";
import CurrencyIcon from "~/components/CurrencyIcon";
import { useFormattedAccountBalance } from "LLM/features/Send/screens/Recipient/hooks/useFormattedAccountBalance";
import type { AddressAccountData } from "../useAddressesViewModel";

type Props = Readonly<{
  data: AddressAccountData;
  onPress: (account: Account) => void;
}>;

export const AddressAccountItem = memo(function AddressAccountItem({ data, onPress }: Props) {
  const { account, name, truncatedAddress } = data;
  const { formattedBalance, formattedCounterValue } = useFormattedAccountBalance(account);

  const handlePress = useCallback(() => onPress(account), [account, onPress]);

  return (
    <ListItem onPress={handlePress} testID={`asset-detail-address-item-${account.id}`}>
      <ListItemLeading>
        <ListItemContent>
          <ListItemTitle numberOfLines={1}>{name}</ListItemTitle>
          <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
            <ListItemDescription numberOfLines={1} ellipsizeMode="middle">
              {truncatedAddress}
            </ListItemDescription>
            <CurrencyIcon currency={account.currency} size={16} squared />
          </Box>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent>
          <ListItemTitle>{formattedCounterValue}</ListItemTitle>
          <ListItemDescription>{formattedBalance}</ListItemDescription>
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
});
