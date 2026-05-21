import React, { memo, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import CurrencyIcon from "~/components/CurrencyIcon";
import { useFormattedAccountBalance } from "LLM/hooks/useFormattedAccountBalance";
import type { AddressAccountData } from "../useAddressesViewModel";

type Props = Readonly<{
  data: AddressAccountData;
  onPress: (data: AddressAccountData) => void;
}>;

export const AddressAccountItem = memo(function AddressAccountItem({ data, onPress }: Props) {
  const { account, balanceAccount, name, truncatedAddress } = data;
  const { formattedBalance, formattedCounterValue } = useFormattedAccountBalance(balanceAccount);

  const handlePress = useCallback(() => onPress(data), [onPress, data]);

  return (
    <Card
      type="interactive"
      onPress={handlePress}
      testID={`asset-detail-address-item-${account.id}`}
    >
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle>{name}</CardContentTitle>
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
              <CardContentDescription>{truncatedAddress}</CardContentDescription>
              <CurrencyIcon currency={account.currency} size={16} squared />
            </Box>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <CardContent>
            <CardContentTitle>{formattedCounterValue}</CardContentTitle>
            <CardContentDescription>{formattedBalance}</CardContentDescription>
          </CardContent>
        </CardTrailing>
      </CardHeader>
    </Card>
  );
});
