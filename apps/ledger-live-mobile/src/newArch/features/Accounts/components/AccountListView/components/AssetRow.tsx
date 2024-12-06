import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Asset } from "~/types/asset";
import ParentCurrencyIcon from "~/components/ParentCurrencyIcon";
import BigNumber from "bignumber.js";
import CounterValue from "~/components/CounterValue";
import Delta from "~/components/Delta";
import { ValueChange } from "@ledgerhq/types-live";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";

interface AssetRowProps {
  asset: Asset;
  balance: BigNumber;
  countervalueChange: ValueChange;
}

const AssetRow: React.FC<AssetRowProps> = ({ asset, balance, countervalueChange }) => {
  const currency = asset.currency;

  return (
    <Flex height={40} flexDirection="row" columnGap={12}>
      <ParentCurrencyIcon currency={currency} size={40} />
      <Flex flex={1} flexShrink={1}>
        <Text
          numberOfLines={1}
          variant="large"
          fontWeight="semiBold"
          color="neutral.c100"
          flexShrink={1}
        >
          {asset.currency.name}
        </Text>
        <Text numberOfLines={1} variant="body" color="neutral.c70" flexShrink={1}>
          <CurrencyUnitValue showCode unit={currency.units[0]} value={balance} />
        </Text>
      </Flex>
      <Flex alignItems="flex-end">
        <Text variant="large" fontWeight="semiBold" color="neutral.c100" testID="asset-balance">
          <CounterValue currency={currency} value={balance} joinFragmentsSeparator="" />
        </Text>
        <Delta
          percent
          show0Delta={balance.toNumber() !== 0}
          fallbackToPercentPlaceholder
          valueChange={countervalueChange}
        />
      </Flex>
    </Flex>
  );
};

export default AssetRow;
