import React from "react";
import { useTranslation } from "react-i18next";
import { bitcoinPickingStrategy, Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import { Account, AccountBridge, AccountRaw, TransactionStatusCommon } from "@ledgerhq/types-live";
import useBitcoinPickingStrategy, {
  Option,
} from "~/renderer/families/bitcoin/useBitcoinPickingStrategy";
import { Text, Flex } from "@ledgerhq/react-ui";
import Select from "~/renderer/components/Select";

type Props = {
  transaction: Transaction;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bridge: AccountBridge<any, Account, TransactionStatusCommon, AccountRaw>;
  onChange: (updateFn: (t: Transaction, p: Partial<Transaction>) => void) => void;
};

export const UtxoStrategyPicker: React.FC<Props> = ({ transaction, bridge, onChange }) => {
  const { t } = useTranslation();
  const { item, options } = useBitcoinPickingStrategy(transaction.utxoStrategy.strategy);

  const handleChange = (selectedItem: Option) => {
    onChange(
      bridge.updateTransaction(transaction, {
        utxoStrategy: {
          ...transaction.utxoStrategy,
          strategy: selectedItem
            ? bitcoinPickingStrategy[selectedItem.value as keyof typeof bitcoinPickingStrategy]
            : 0,
        },
      }),
    );
  };

  return (
    <Flex flexDirection="column" rowGap={1}>
      <Text variant="h2Inter" flex={1} fontSize={14}>
        {t("bitcoin.strategy")}
      </Text>
      <Select
        isSearchable={false}
        placeholder={t("bitcoin.strategy")}
        options={options}
        value={item}
        onChange={selectedItem => handleChange(selectedItem as Option)}
      />
    </Flex>
  );
};
