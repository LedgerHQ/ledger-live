import { getUTXOStatus } from "@ledgerhq/live-common/families/bitcoin/logic";
import {
  bitcoinPickingStrategy,
  type BitcoinAccount,
  type BitcoinOutput,
  type Transaction as BitcoinTransaction,
  type TransactionStatus as BitcoinTransactionStatus,
} from "@ledgerhq/live-common/families/bitcoin/types";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { BigNumber } from "bignumber.js";
import { useMemo } from "react";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";

function isBitcoinBasedAccount(account: AccountLike): account is BitcoinAccount {
  return "bitcoinResources" in account && account.bitcoinResources !== undefined;
}

function hasUtxoStrategy(tx: Transaction): tx is BitcoinTransaction {
  return "utxoStrategy" in tx && tx.utxoStrategy != null;
}

function isBitcoinTransactionStatus(s: TransactionStatus): s is BitcoinTransactionStatus {
  return "txInputs" in s;
}

export type PickingStrategyOption = Readonly<{
  value: number;
  labelKey: string;
}>;

export type UtxoRowDisplayData = Readonly<{
  utxo: BitcoinOutput;
  titleLabel: string;
  formattedValue: string;
  excluded: boolean;
  exclusionReason: "pickPendingUtxo" | "userExclusion" | undefined;
  isUsedInTx: boolean;
  unconfirmed: boolean;
  isLastSelected: boolean;
  disabled: boolean;
  confirmations: number;
}>;

export type UseBitcoinUtxoDisplayDataParams = Readonly<{
  account: AccountLike;
  transaction: Transaction;
  status: TransactionStatus;
  locale: string;
}>;

export type BitcoinUtxoDisplayData = Readonly<{
  pickingStrategyOptions: readonly PickingStrategyOption[];
  pickingStrategyValue: number;
  totalExcludedUTXOS: number;
  totalSpent: BigNumber;
  utxoRows: readonly UtxoRowDisplayData[];
}>;

// Object.keys returns string[]; cast needed for keyof typeof
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const pickingStrategyKeys = Object.keys(
  bitcoinPickingStrategy,
) as (keyof typeof bitcoinPickingStrategy)[];

const pickingStrategyOptions: readonly PickingStrategyOption[] = pickingStrategyKeys.map(key => ({
  value: bitcoinPickingStrategy[key],
  labelKey: `bitcoin.pickingStrategyLabels.${key}`,
}));

type UtxoStatus = ReturnType<typeof getUTXOStatus>;

function utxoToRowDisplayData(
  utxo: BitcoinOutput,
  utxoStatus: UtxoStatus,
  context: Readonly<{
    rowIndex: number;
    txInputs: BitcoinTransactionStatus["txInputs"];
    totalExcludedUTXOS: number;
    utxosLength: number;
    blockHeight: number;
    accountUnit: BitcoinAccount["currency"]["units"][0];
    locale: string;
  }>,
): UtxoRowDisplayData {
  const exclusionReason = utxoStatus.excluded ? utxoStatus.reason : undefined;
  const isUsedInTx = (context.txInputs ?? []).some(
    input => input.previousOutputIndex === utxo.outputIndex && input.previousTxHash === utxo.hash,
  );
  const unconfirmed = exclusionReason === "pickPendingUtxo";
  const isLastSelected =
    !utxoStatus.excluded && context.totalExcludedUTXOS + 1 === context.utxosLength;
  const disabled = unconfirmed || isLastSelected;
  const confirmations = utxo.blockHeight ? Math.max(0, context.blockHeight - utxo.blockHeight) : 0;
  const formattedValue = formatCurrencyUnit(context.accountUnit, utxo.value, {
    showCode: true,
    disableRounding: true,
    locale: context.locale,
  });

  const address = utxo.address ?? "";
  const titleLabel =
    `#${context.rowIndex + 1} ${address ? `${address.slice(0, 8)}...${address.slice(-4)}` : ""}`.trim();

  return {
    utxo,
    titleLabel,
    formattedValue,
    excluded: utxoStatus.excluded,
    exclusionReason,
    isUsedInTx,
    unconfirmed,
    isLastSelected,
    disabled,
    confirmations,
  };
}

/**
 * Fetches all parameters needed to display Bitcoin UTXO rows and the picking strategy selector,
 * derived from account bitcoin resources, transaction utxoStrategy, and status.
 * Returns null when the account is not Bitcoin-based or the transaction has no utxoStrategy.
 */
export function useBitcoinUtxoDisplayData({
  account,
  transaction,
  status,
  locale,
}: UseBitcoinUtxoDisplayDataParams): BitcoinUtxoDisplayData | null {
  return useMemo(() => {
    if (!isBitcoinBasedAccount(account)) return null;
    if (!hasUtxoStrategy(transaction)) return null;
    if (!isBitcoinTransactionStatus(status)) return null;

    const bitcoinResources = account.bitcoinResources;
    if (!bitcoinResources?.utxos?.length) return null;

    const accountUnit = account.currency.units[0];
    const { utxoStrategy } = transaction;
    const utxos = bitcoinResources.utxos;
    const blockHeight = account.blockHeight ?? 0;

    const utxoStatuses = utxos.map(u => getUTXOStatus(u, utxoStrategy));
    const totalExcludedUTXOS = utxoStatuses.filter(s => s.excluded).length;

    const txInputs = status.txInputs ?? [];

    const utxoRows: UtxoRowDisplayData[] = utxos.map((utxo, rowIndex) =>
      utxoToRowDisplayData(utxo, utxoStatuses[rowIndex], {
        rowIndex,
        txInputs,
        totalExcludedUTXOS,
        utxosLength: utxos.length,
        blockHeight,
        accountUnit,
        locale,
      }),
    );

    return {
      pickingStrategyOptions,
      pickingStrategyValue: utxoStrategy.strategy,
      totalExcludedUTXOS,
      totalSpent: status.totalSpent ?? new BigNumber(0),
      utxoRows,
    };
  }, [account, locale, status, transaction]);
}
