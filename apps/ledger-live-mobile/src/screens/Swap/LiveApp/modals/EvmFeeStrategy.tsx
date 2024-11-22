import React, { useEffect, useMemo } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useGasOptions } from "@ledgerhq/live-common/families/evm/react";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { FeeData, Strategy, Transaction } from "@ledgerhq/coin-evm/lib/types/index";
import { FlatList } from "react-native";
import { ListRenderItem } from "react-native";

type Props = {
  currency: CryptoCurrency;
  transaction: Transaction;
  onClose(): void;
};

const STRATEGIES: Strategy[] = ["slow", "medium", "fast"];

const StrategyItem: ListRenderItem<FeeData & { strategy: Strategy }> = ({ item }) => {
  return (
    <Flex>
      <Text>{item.strategy}</Text>
      <Text>{item.gasPrice?.toString()}</Text>
    </Flex>
  );
};

export function EvmFeeStrategy({ currency, transaction }: Props) {
  const [gasOptions, error, loading] = useGasOptions({
    currency,
    transaction,
    interval: currency.blockAvgTime ? currency.blockAvgTime * 1000 : undefined,
  });

  const strategies = useMemo(() => {
    if (!gasOptions) return [];
    return STRATEGIES.map(strategy => ({ strategy, ...gasOptions[strategy] }));
  }, [gasOptions]);

  useEffect(() => {
    console.log(gasOptions, error, loading);
  }, [gasOptions, loading, error]);

  return (
    <Flex>
      <Text>{`Fee Strategy`}</Text>
      <FlatList data={strategies} renderItem={StrategyItem} keyExtractor={item => item.strategy} />
    </Flex>
  );
}
