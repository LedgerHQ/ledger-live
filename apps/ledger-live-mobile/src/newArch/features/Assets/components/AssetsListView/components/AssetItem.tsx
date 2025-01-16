import React, { useMemo } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Asset } from "~/types/asset";
import ParentCurrencyIcon from "~/components/ParentCurrencyIcon";
import BigNumber from "bignumber.js";
import CounterValue from "~/components/CounterValue";
import Delta from "~/components/Delta";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { usePortfolioForAccounts } from "~/hooks/portfolio";

interface AssetItemProps {
  asset: Asset;
  balance: BigNumber;
}

const AssetItem: React.FC<AssetItemProps> = ({ asset, balance }) => {
  const currency = asset.currency;

  const portfolio = usePortfolioForAccounts(asset.accounts);
  const countervalueChange = useMemo(() => {
    return portfolio.countervalueChange;
  }, [portfolio]);

  return (
    <>
      <ParentCurrencyIcon currency={currency} size={40} forceIconScale={1.2} />
      <Flex flex={1} flexShrink={1} testID={`assetItem-${currency.name}`}>
        <Text
          numberOfLines={1}
          variant="large"
          fontWeight="semiBold"
          color="neutral.c100"
          flexShrink={1}
        >
          {currency.name}
        </Text>
        <Text numberOfLines={1} variant="body" color="neutral.c70" flexShrink={1}>
          <CurrencyUnitValue showCode unit={currency?.units?.[0]} value={balance} />
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
    </>
  );
};

export default AssetItem;
