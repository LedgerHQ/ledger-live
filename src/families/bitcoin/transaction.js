// @flow
import { BigNumber } from "bignumber.js";
import type {
  Transaction,
  TransactionRaw,
  FeeItems,
  FeeItemsRaw,
  BitcoinOutput,
  UtxoStrategy,
  CoreBitcoinLikeOutput,
  CoreBitcoinLikeInput,
  BitcoinInput,
} from "./types";
import type { Account } from "../../types";
import { bitcoinPickingStrategy } from "./types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "../../transaction/common";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";

export type UTXOStatus =
  | {
      excluded: true,
      reason: "pickUnconfirmedRBF" | "userExclusion",
    }
  | {
      excluded: false,
    };

export async function parseBitcoinInput(
  input: CoreBitcoinLikeInput
): Promise<BitcoinInput> {
  const address = await input.getAddress();
  const rawValue = await input.getValue();
  const value = rawValue ? await libcoreAmountToBigNumber(rawValue) : null;
  const previousTxHash = await input.getPreviousTxHash();
  const previousOutputIndex = await input.getPreviousOutputIndex();
  return { address, value, previousTxHash, previousOutputIndex };
}

export async function parseBitcoinOutput(
  output: CoreBitcoinLikeOutput
): Promise<BitcoinOutput> {
  let blockHeight = await output.getBlockHeight();
  if (!blockHeight || blockHeight < 0) {
    blockHeight = undefined;
  }
  const hash = await output.getTransactionHash();
  const outputIndex = await output.getOutputIndex();
  const address = await output.getAddress();
  const derivationPath = await output.getDerivationPath();
  let path;
  if (derivationPath) {
    const isDerivationPathNull = await derivationPath.isNull();
    if (!isDerivationPathNull) {
      path = await derivationPath.toString();
    }
  }
  const value = await libcoreAmountToBigNumber(await output.getValue());
  const rbf = false; // this is unsafe to generically call this at the moment. libcore segfault.
  return { hash, outputIndex, blockHeight, address, path, value, rbf };
}

export async function parseBitcoinUTXO(
  output: CoreBitcoinLikeOutput
): Promise<BitcoinOutput> {
  const utxo = await parseBitcoinOutput(output);
  utxo.rbf = await output.isReplaceable();
  return utxo;
}

export function getUTXOStatus(
  utxo: BitcoinOutput,
  utxoStrategy: UtxoStrategy
): UTXOStatus {
  if (!utxoStrategy.pickUnconfirmedRBF && utxo.rbf && !utxo.blockHeight) {
    return { excluded: true, reason: "pickUnconfirmedRBF" };
  }
  if (
    utxoStrategy.excludeUTXOs.some(
      (u) => u.hash === utxo.hash && u.outputIndex === utxo.outputIndex
    )
  ) {
    return { excluded: true, reason: "userExclusion" };
  }
  return { excluded: false };
}

export function isChangeOutput(output: BitcoinOutput): boolean {
  if (!output.path) return false;
  const p = output.path.split("/");
  return p[p.length - 2] === "1";
}

const fromFeeItemsRaw = (fir: FeeItemsRaw): FeeItems => ({
  items: fir.items.map((fi) => ({
    key: fi.key,
    speed: fi.speed,
    feePerByte: BigNumber(fi.feePerByte),
  })),
  defaultFeePerByte: BigNumber(fir.defaultFeePerByte),
});

const toFeeItemsRaw = (fir: FeeItems): FeeItemsRaw => ({
  items: fir.items.map((fi) => ({
    key: fi.key,
    speed: fi.speed,
    feePerByte: fi.feePerByte.toString(),
  })),
  defaultFeePerByte: fir.defaultFeePerByte.toString(),
});

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    rbf: tr.rbf,
    utxoStrategy: tr.utxoStrategy,
    family: tr.family,
    feePerByte: tr.feePerByte ? BigNumber(tr.feePerByte) : null,
    networkInfo: tr.networkInfo && {
      family: tr.networkInfo.family,
      feeItems: fromFeeItemsRaw(tr.networkInfo.feeItems),
    },
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    rbf: t.rbf,
    utxoStrategy: t.utxoStrategy,
    family: t.family,
    feePerByte: t.feePerByte ? t.feePerByte.toString() : null,
    networkInfo: t.networkInfo && {
      family: t.networkInfo.family,
      feeItems: toFeeItemsRaw(t.networkInfo.feeItems),
    },
  };
};

const formatNetworkInfo = (networkInfo: ?{ feeItems: FeeItems }) => {
  if (!networkInfo) return "network info not loaded";
  return `network fees: ${networkInfo.feeItems.items
    .map((i) => i.key + "=" + i.feePerByte.toString())
    .join(", ")}`;
};

export const formatTransaction = (t: Transaction, account: Account): string =>
  `
SEND ${
    t.useAllAmount
      ? "MAX"
      : formatCurrencyUnit(getAccountUnit(account), t.amount, {
          showCode: true,
          disableRounding: true,
        })
  }
TO ${t.recipient}
with feePerByte=${
    t.feePerByte ? t.feePerByte.toString() : "?"
  } (${formatNetworkInfo(t.networkInfo)})
${[
  Object.keys(bitcoinPickingStrategy).find(
    (k) => bitcoinPickingStrategy[k] === t.utxoStrategy.strategy
  ),
  t.utxoStrategy.pickUnconfirmedRBF && "pick-unconfirmed",
  t.rbf && "RBF-enabled",
]
  .filter(Boolean)
  .join(" ")}${t.utxoStrategy.excludeUTXOs
    .map((utxo) => `\nexclude ${utxo.hash} @${utxo.outputIndex}`)
    .join("")}`;

export default { fromTransactionRaw, toTransactionRaw, formatTransaction };
