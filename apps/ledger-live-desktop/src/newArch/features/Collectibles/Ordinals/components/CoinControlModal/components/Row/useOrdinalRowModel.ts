import { useState } from "react";
import {
  BitcoinAccount,
  BitcoinOutput,
  Transaction,
  TransactionStatus,
  UtxoStrategy,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { AccountBridge } from "@ledgerhq/types-live";
import { getUTXOStatus } from "@ledgerhq/live-common/families/bitcoin/logic";

export type Props = {
  utxo: BitcoinOutput;
  utxoStrategy: UtxoStrategy;
  status: TransactionStatus;
  account: BitcoinAccount;
  totalExcludedUTXOS: number;
  bridge: AccountBridge<Transaction>;
  unit: Unit;
  updateTransaction: (updater: (t: Transaction) => Transaction) => void;
};

export const useOrdinalRowModel = ({
  utxo,
  utxoStrategy,
  status,
  account,
  totalExcludedUTXOS,
  bridge,
  unit,
  updateTransaction,
}: Props) => {
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const { excluded, reason } = getUTXOStatus(utxo, utxoStrategy);
  const utxoStatus = excluded ? reason || "" : "";

  const input = (status.txInputs || []).find(
    input => input.previousOutputIndex === utxo.outputIndex && input.previousTxHash === utxo.hash,
  );
  const unconfirmed = utxoStatus === "pickPendingUtxo";
  const last = !excluded && totalExcludedUTXOS + 1 === account.bitcoinResources?.utxos.length;
  const disabled = unconfirmed || last;

  const handleClick = () => {
    if (disabled) return;
    const updatedStrategy = {
      ...utxoStrategy,
      excludeUTXOs: excluded
        ? utxoStrategy.excludeUTXOs.filter(
            e => e.hash !== utxo.hash || e.outputIndex !== utxo.outputIndex,
          )
        : [...utxoStrategy.excludeUTXOs, { hash: utxo.hash, outputIndex: utxo.outputIndex }],
    };

    updateTransaction(t => bridge.updateTransaction(t, { utxoStrategy: updatedStrategy }));
  };

  const toggleDetailsVisibility = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDetailsVisible(!isDetailsVisible);
  };

  return {
    utxo,
    account,
    unit,
    isDetailsVisible,
    disabled,
    last,
    unconfirmed,
    input,
    excluded,
    toggleDetailsVisibility,
    handleClick,
  };
};
