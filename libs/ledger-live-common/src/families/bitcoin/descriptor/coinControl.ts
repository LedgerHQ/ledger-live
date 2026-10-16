import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import type { AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type {
  CoinControlBuildStrategyChangePatchParams,
  CoinControlBuildToggleRowExclusionPatchParams,
  CoinControlConfig,
  CoinControlDisplayData,
  CoinControlGetDisplayDataParams,
  CoinControlUtxoRow,
} from "../../../bridge/descriptor/types";
import type {
  Transaction as SendFlowTransaction,
  TransactionStatus,
} from "../../../coin-modules/transaction-types";
import { getUTXOStatus } from "../logic";
import {
  bitcoinPickingStrategy,
  getFamilySpecificData,
  getFeeParameters,
  getUtxoStrategy,
  type BitcoinAccount,
  type BitcoinOutput,
  type Transaction as BitcoinTransaction,
} from "../types";

function isBitcoinBasedAccount(account: AccountLike): account is BitcoinAccount {
  return "bitcoinResources" in account && account.bitcoinResources !== undefined;
}

function isBitcoinUtxoTransaction(tx: SendFlowTransaction): tx is BitcoinTransaction {
  return tx.family === "bitcoin";
}

/** The inputs the last estimation selected, "txid:index". */
function usedInputs(transaction: BitcoinTransaction): Set<string> {
  return new Set((getFeeParameters(transaction).inputs ?? []).map(i => `${i.txid}:${i.vout}`));
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
  disabled: boolean;
  confirmations: number;
}>;

export type UseBitcoinUtxoDisplayDataParams = Readonly<{
  account: AccountLike;
  transaction: SendFlowTransaction;
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
  labelKey: `bitcoin.pickingStrategyLabels.${String(key)}`,
}));

type UtxoStatus = ReturnType<typeof getUTXOStatus>;

function utxoToRowDisplayData(
  utxo: BitcoinOutput,
  utxoStatus: UtxoStatus,
  context: Readonly<{
    rowIndex: number;
    usedInputs: Set<string>;
    totalExcludedUTXOS: number;
    utxosLength: number;
    blockHeight: number;
    accountUnit: BitcoinAccount["currency"]["units"][0];
    locale: string;
    transaction: BitcoinTransaction;
    amountTargetReached: boolean;
  }>,
): UtxoRowDisplayData {
  const exclusionReason = utxoStatus.excluded ? utxoStatus.reason : undefined;
  const isUsedInTx = context.usedInputs.has(`${utxo.hash}:${utxo.outputIndex}`);
  const unconfirmed = exclusionReason === "pickPendingUtxo";
  const disabled =
    unconfirmed || (context.amountTargetReached && exclusionReason === "userExclusion");
  const confirmations = utxo.blockHeight ? Math.max(0, context.blockHeight - utxo.blockHeight) : 0;
  const formattedValue = formatCurrencyUnit(context.accountUnit, utxo.value, {
    showCode: true,
    disableRounding: true,
    locale: context.locale,
  });

  const address = utxo.address ?? "";
  const addressLabel = address ? `${address.slice(0, 8)}...${address.slice(-4)}` : "";
  const titleLabel = `#${context.rowIndex + 1} ${addressLabel}`.trim();

  return {
    utxo,
    titleLabel,
    formattedValue,
    excluded: utxoStatus.excluded,
    exclusionReason,
    isUsedInTx,
    unconfirmed,
    disabled,
    confirmations,
  };
}

function computeBitcoinUtxoDisplayData({
  account,
  transaction,
  status,
  locale,
}: UseBitcoinUtxoDisplayDataParams): BitcoinUtxoDisplayData | null {
  if (!isBitcoinBasedAccount(account)) return null;
  if (!isBitcoinUtxoTransaction(transaction)) return null;

  const bitcoinAccount = account;
  const bitcoinResources = bitcoinAccount.bitcoinResources;
  if (!bitcoinResources?.utxos?.length) return null;

  const accountUnit = bitcoinAccount.currency.units[0];
  const utxoStrategy = getUtxoStrategy(transaction);
  const utxos = bitcoinResources.utxos;
  const blockHeight = bitcoinAccount.blockHeight ?? 0;

  const utxoStatuses = utxos.map(u => getUTXOStatus(u, utxoStrategy));
  const totalExcludedUTXOS = utxoStatuses.filter(s => s.excluded).length;

  const selectedUtxosTotal = utxoStatuses.reduce(
    (sum, s, i) => (s.excluded ? sum : sum.plus(utxos[i].value)),
    new BigNumber(0),
  );
  const amountTargetApplies = !transaction.useAllAmount && transaction.amount.gt(0);

  const amountWithEstimatedFees = status.estimatedFees
    ? transaction.amount.plus(status.estimatedFees)
    : transaction.amount;
  const requiredTotal = status.totalSpent || amountWithEstimatedFees;

  const amountError = status.errors?.amount;
  const hasInsufficientBalanceError =
    amountError?.name === "NotEnoughBalance" || amountError?.name === "NotEnoughSpendableBalance";

  const amountTargetReached =
    amountTargetApplies && !hasInsufficientBalanceError && selectedUtxosTotal.gte(requiredTotal);
  const inputsInTx = usedInputs(transaction);

  const utxoRows: UtxoRowDisplayData[] = utxos.map((utxo, rowIndex) =>
    utxoToRowDisplayData(utxo, utxoStatuses[rowIndex], {
      rowIndex,
      usedInputs: inputsInTx,
      totalExcludedUTXOS,
      utxosLength: utxos.length,
      blockHeight,
      accountUnit,
      locale,
      transaction,
      amountTargetReached,
    }),
  );

  return {
    pickingStrategyOptions,
    pickingStrategyValue: utxoStrategy.strategy,
    totalExcludedUTXOS,
    totalSpent: status.totalSpent ?? new BigNumber(0),
    utxoRows,
  };
}

function mapBitcoinUtxoDisplayDataToCoinControl(
  data: BitcoinUtxoDisplayData,
): CoinControlDisplayData {
  const utxoRows: readonly CoinControlUtxoRow[] = data.utxoRows.map(row => ({
    rowKey: `${row.utxo.hash}-${row.utxo.outputIndex}`,
    titleLabel: row.titleLabel,
    formattedValue: row.formattedValue,
    excluded: row.excluded,
    exclusionReason: row.exclusionReason,
    isUsedInTx: row.isUsedInTx,
    unconfirmed: row.unconfirmed,
    disabled: row.disabled,
    confirmations: row.confirmations,
  }));

  return {
    pickingStrategyOptions: data.pickingStrategyOptions,
    pickingStrategyValue: data.pickingStrategyValue,
    totalExcludedUTXOS: data.totalExcludedUTXOS,
    totalSpent: data.totalSpent,
    utxoRows,
  };
}

function parseBitcoinRowKey(rowKey: string): { hash: string; outputIndex: number } | null {
  const lastDash = rowKey.lastIndexOf("-");
  if (lastDash <= 0) return null;
  const hash = rowKey.slice(0, lastDash);
  const idx = Number.parseInt(rowKey.slice(lastDash + 1), 10);
  if (Number.isNaN(idx)) return null;
  return { hash, outputIndex: idx };
}

function isBitcoinTransaction(tx: unknown): tx is BitcoinTransaction {
  return typeof tx === "object" && tx !== null && (tx as { family?: unknown }).family === "bitcoin";
}

/** The patch is merged shallowly: the other user choices of `familySpecificData` are kept. */
const utxoStrategyPatch = (
  transaction: BitcoinTransaction,
  utxoStrategy: ReturnType<typeof getUtxoStrategy>,
): Partial<SendFlowTransaction> =>
  ({
    familySpecificData: { ...getFamilySpecificData(transaction), utxoStrategy },
  }) as Partial<SendFlowTransaction>;

function getBitcoinCoinControlDisplayData(
  params: CoinControlGetDisplayDataParams,
): CoinControlDisplayData | null {
  const raw = computeBitcoinUtxoDisplayData({
    account: params.account,
    transaction: params.transaction as SendFlowTransaction,
    status: params.status as TransactionStatus,
    locale: params.locale,
  });
  return raw ? mapBitcoinUtxoDisplayDataToCoinControl(raw) : null;
}

function buildStrategyChangePatch({
  transaction,
  strategy,
  displayData,
}: CoinControlBuildStrategyChangePatchParams): Partial<SendFlowTransaction> | null {
  if (!isBitcoinTransaction(transaction)) return null;

  const excludeUTXOs =
    strategy === bitcoinPickingStrategy.CUSTOM && displayData != null
      ? displayData.utxoRows
          .map(row => parseBitcoinRowKey(row.rowKey))
          .filter((p): p is { hash: string; outputIndex: number } => p != null)
      : [];

  return utxoStrategyPatch(transaction, {
    ...getUtxoStrategy(transaction),
    strategy: strategy as ReturnType<typeof getUtxoStrategy>["strategy"],
    excludeUTXOs,
  });
}

function buildToggleRowExclusionPatch({
  transaction,
  rowKey,
  displayData,
}: CoinControlBuildToggleRowExclusionPatchParams): Partial<SendFlowTransaction> | null {
  if (!isBitcoinTransaction(transaction)) return null;
  const utxoStrategy = getUtxoStrategy(transaction);
  if (utxoStrategy.strategy !== bitcoinPickingStrategy.CUSTOM) return null;

  const row = displayData?.utxoRows.find(r => r.rowKey === rowKey);
  if (!row || row.disabled) return null;

  const parsed = parseBitcoinRowKey(rowKey);
  if (parsed == null) return null;

  const id = { hash: parsed.hash, outputIndex: parsed.outputIndex };

  return utxoStrategyPatch(transaction, {
    ...utxoStrategy,
    excludeUTXOs: row.excluded
      ? utxoStrategy.excludeUTXOs.filter(
          e => e.hash !== id.hash || e.outputIndex !== id.outputIndex,
        )
      : utxoStrategy.excludeUTXOs.concat(id),
  });
}

/** The change the last estimation gives back to the account. */
function getChangeToReturn({ transaction }: { transaction: SendFlowTransaction }): BigNumber {
  if (!isBitcoinUtxoTransaction(transaction)) return new BigNumber(0);
  return (getFeeParameters(transaction).outputs ?? [])
    .filter(output => output.isChange)
    .reduce((sum, output) => sum.plus(output.value), new BigNumber(0));
}

export const bitcoinCoinControlConfig: CoinControlConfig = {
  customStrategyValue: bitcoinPickingStrategy.CUSTOM,
  getStrategyValue: transaction =>
    isBitcoinUtxoTransaction(transaction) ? getUtxoStrategy(transaction).strategy : undefined,
  getChangeToReturn,
  getDisplayData: getBitcoinCoinControlDisplayData,
  buildStrategyChangePatch,
  buildToggleRowExclusionPatch,
};
