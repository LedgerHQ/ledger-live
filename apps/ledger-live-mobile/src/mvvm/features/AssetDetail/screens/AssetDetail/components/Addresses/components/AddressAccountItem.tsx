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
  Tag,
} from "@ledgerhq/lumen-ui-rnative";
import CurrencyIcon from "~/components/CurrencyIcon";
import { useFormattedAccountBalance } from "LLM/hooks/useFormattedAccountBalance";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import type { AddressAccountData } from "../useAddressesViewModel";

type Props = Readonly<{
  data: AddressAccountData;
  onPress: (data: AddressAccountData) => void;
}>;

export const AddressAccountItem = memo(function AddressAccountItem({ data, onPress }: Props) {
  const { account, balanceAccount, name, tag, truncatedAddress } = data;
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
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
              <CardContentTitle testID={`${ASSET_DETAIL_TEST_IDS.addressItemName}-${account.id}`}>
                {name}
              </CardContentTitle>
              {tag ? (
                <Tag
                  label={tag}
                  size="sm"
                  appearance="gray"
                  testID={`${ASSET_DETAIL_TEST_IDS.addressItemTag}-${account.id}`}
                />
              ) : null}
            </Box>
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
              <CardContentDescription
                testID={`${ASSET_DETAIL_TEST_IDS.addressItemAddress}-${account.id}`}
              >
                {truncatedAddress}
              </CardContentDescription>
              <CurrencyIcon currency={account.currency} size={16} squared />
            </Box>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <CardContent>
            <CardContentTitle
              testID={`${ASSET_DETAIL_TEST_IDS.addressItemCounterValue}-${account.id}`}
            >
              {formattedCounterValue}
            </CardContentTitle>
            <CardContentDescription
              testID={`${ASSET_DETAIL_TEST_IDS.addressItemBalance}-${account.id}`}
            >
              {formattedBalance}
            </CardContentDescription>
          </CardContent>
        </CardTrailing>
      </CardHeader>
    </Card>
  );
});
