import { BigNumber } from "bignumber.js";
import { bchToCashaddrAddressWithoutPrefix } from "./logic";
import cashaddr from "cashaddrjs";
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
  BitcoinResources,
} from "./types";
import type { Account } from "../../types";
import { bitcoinPickingStrategy } from "./types";
import { getEnv } from "../../env";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "../../transaction/common";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import type { CryptoCurrencyIds } from "../../types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";

const fromFeeItemsRaw = (fir: FeeItemsRaw): FeeItems => ({
  items: fir.items.map((fi) => ({
    key: fi.key,
    speed: fi.speed,
    feePerByte: new BigNumber(fi.feePerByte),
  })),
  defaultFeePerByte: new BigNumber(fir.defaultFeePerByte),
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
    feePerByte: tr.feePerByte ? new BigNumber(tr.feePerByte) : null,
    networkInfo: tr.networkInfo && {
      family: tr.networkInfo.family,
      feeItems: fromFeeItemsRaw(tr.networkInfo.feeItems),
    },
    feesStrategy: tr.feesStrategy,
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
    feesStrategy: t.feesStrategy,
  };
};

const formatNetworkInfo = (
  networkInfo:
    | {
        feeItems: FeeItems;
      }
    | null
    | undefined
) => {
  if (!networkInfo) return "network info not loaded";
  return `network fees: ${networkInfo.feeItems.items
    .map((i) => i.key + "=" + i.feePerByte.toString())
    .join(", ")}`;
};

export const formatTransaction = (t: Transaction, account: Account): string => {
  const n = getEnv("DEBUG_UTXO_DISPLAY");
  const { excludeUTXOs, strategy, pickUnconfirmedRBF } = t.utxoStrategy;
  const displayAll = excludeUTXOs.length <= n;
  return `
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
    (k) => bitcoinPickingStrategy[k] === strategy
  ),
  pickUnconfirmedRBF && "pick-unconfirmed",
  t.rbf && "RBF-enabled",
]
  .filter(Boolean)
  .join(" ")}${excludeUTXOs
    .slice(0, displayAll ? excludeUTXOs.length : n)
    .map((utxo) => `\nexclude ${utxo.hash} @${utxo.outputIndex}`)
    .join("")}`;
};

// vvvvv DEPRECATED - used only by legacy libcore implementation vvvvv

function bchExplicit(str: string): string {
  const explicit = str.includes(":") ? str : "bitcoincash:" + str;

  try {
    const { type } = cashaddr.decode(explicit);
    if (type === "P2PKH") return explicit;
  } catch (e) {
    // ignore errors
  }

  return str;
}

export type CoinLogic = {
  hasExtraData?: boolean;
  hasExpiryHeight?: boolean;
  getAdditionals?: (arg0: { transaction: Transaction }) => string[];
  asLibcoreTransactionRecipient?: (arg0: string) => string;
  onScreenTransactionRecipient?: (arg0: string) => string;
  postBuildBitcoinResources?: (
    arg0: Account,
    arg1: BitcoinResources
  ) => BitcoinResources;
  syncReplaceAddress?: (
    existingAccount: Account | null | undefined,
    addr: string
  ) => string;
  injectGetAddressParams?: (arg0: Account) => any;
};
export const perCoinLogic: Record<
  CryptoCurrencyIds,
  CoinLogic | null | undefined
> = {
  zencash: {
    hasExtraData: true, // FIXME investigate why we need this here and drop
  },
  zcash: {
    hasExtraData: true,
    hasExpiryHeight: true,
    getAdditionals: () => ["sapling"], // FIXME drop in ledgerjs. we always use sapling now for zcash & kmd
  },
  komodo: {
    hasExtraData: true,
    hasExpiryHeight: true,
    getAdditionals: () => ["sapling"], // FIXME drop in ledgerjs. we always use sapling now for zcash & kmd
  },
  decred: {
    hasExpiryHeight: true,
  },
  bitcoin_gold: {
    getAdditionals: () => ["bip143"],
  },
  bitcoin_cash: {
    getAdditionals: ({ transaction }) => {
      const additionals = ["bip143"];

      if (bchExplicit(transaction.recipient).startsWith("bitcoincash:")) {
        additionals.push("cashaddr");
      }

      return additionals;
    },
    // due to libcore minimal support, we need to return the explicit format of bitcoincash:.. if it's a P2PKH
    asLibcoreTransactionRecipient: bchExplicit,
    // to represent what happens on the device, which do not display the bitcoincash: prefix
    onScreenTransactionRecipient: (str: string): string => {
      const prefix = "bitcoincash:";
      return str.startsWith(prefix) ? str.slice(prefix.length) : str;
    },
    syncReplaceAddress: (existingAccount, addr) =>
      bchToCashaddrAddressWithoutPrefix(addr),
    injectGetAddressParams: () => ({
      forceFormat: "cashaddr",
    }),
  },
};
export type UTXOStatus =
  | {
      excluded: true;
      reason: "pickUnconfirmedRBF" | "userExclusion";
    }
  | {
      excluded: false;
    };
export async function parseBitcoinInput(
  input: CoreBitcoinLikeInput
): Promise<BitcoinInput> {
  const address = await input.getAddress();
  const rawValue = await input.getValue();
  const value = rawValue ? await libcoreAmountToBigNumber(rawValue) : null;
  const previousTxHash = await input.getPreviousTxHash();
  const previousOutputIndex = await input.getPreviousOutputIndex();
  return {
    address,
    value,
    previousTxHash,
    previousOutputIndex,
  };
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

  return {
    hash,
    outputIndex,
    blockHeight,
    address,
    isChange: false,
    path,
    value,
    rbf,
  };
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
    return {
      excluded: true,
      reason: "pickUnconfirmedRBF",
    };
  }

  if (
    utxoStrategy.excludeUTXOs.some(
      (u) => u.hash === utxo.hash && u.outputIndex === utxo.outputIndex
    )
  ) {
    return {
      excluded: true,
      reason: "userExclusion",
    };
  }

  return {
    excluded: false,
  };
}
export function isChangeOutput(output: BitcoinOutput): boolean {
  if (!output.path) return false;
  const p = output.path.split("/");
  return p[p.length - 2] === "1";
}
// ==============================================================================

export default {
  fromTransactionRaw,
  toTransactionRaw,
  formatTransaction,
};
