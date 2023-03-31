import React from "react";
import { Trans } from "react-i18next";
import { bitcoinPickingStrategy, Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import { Account } from "@ledgerhq/types-live";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Select from "~/renderer/components/Select";
import useBitcoinPickingStrategy from "./useBitcoinPickingStrategy";
type Props = {
  account: Account;
  transaction: Transaction;
  onChange: (a: Transaction) => void;
  status: TransactionStatus;
};
export const PickingStrategy = ({ transaction, account, onChange, status }: Props) => {
  const bridge = getAccountBridge(account);
  const { item, options } = useBitcoinPickingStrategy(transaction.utxoStrategy.strategy);
  return (
    <Box flow={2} horizontal alignItems="center" justifyContent="space-between">
      <Text color="palette.text.shade50" ff="Inter|Regular" fontSize={13}>
        <Trans i18nKey="bitcoin.strategy" />
      </Text>
      <Select
        width={300}
        options={options}
        value={item}
        onChange={item =>
          onChange(
            bridge.updateTransaction(transaction, {
              utxoStrategy: {
                ...transaction.utxoStrategy,
                strategy: bitcoinPickingStrategy[item.value] || 0,
              },
            }),
          )
        }
      />
    </Box>
  );
};
