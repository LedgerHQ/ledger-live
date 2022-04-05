import cashaddr from "cashaddrjs";
import { Currency, isValidAddress } from "./wallet-btc";
import { RecipientRequired, InvalidAddress } from "@ledgerhq/errors";
import type { Account, CryptoCurrency, CryptoCurrencyIds } from "./../../types";
import type {
  BitcoinOutput,
  BitcoinResources,
  Transaction,
  NetworkInfo,
  UtxoStrategy,
  CoreBitcoinLikeOutput,
  CoreBitcoinLikeInput,
  BitcoinInput,
} from "./types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";

// correspond ~ to min relay fees but determined empirically for a tx to be accepted by network
const minFees = {
  bitcoin: 1000,
  bitcoin_gold: 1000,
  pivx: 2000,
  stakenet: 1000,
  stealthcoin: 2000,
  qtum: 4000,
  stratis: 2000,
  vertcoin: 2000,
  viacoin: 2000,
  peercoin: 2000,
};
export const getMinRelayFee = (currency: CryptoCurrency): number =>
  minFees[currency.id] || 0;
export const inferFeePerByte = (t: Transaction, networkInfo: NetworkInfo) => {
  if (t.feesStrategy) {
    const speed = networkInfo.feeItems.items.find(
      (item) => t.feesStrategy === item.speed
    );

    if (!speed) {
      return networkInfo.feeItems.defaultFeePerByte;
    }

    return speed.feePerByte;
  }

  return t.feePerByte || networkInfo.feeItems.defaultFeePerByte;
};
export const isValidRecipient = async (params: {
  currency: CryptoCurrency;
  recipient: string;
}): Promise<Error | null | undefined> => {
  if (!params.recipient) {
    return Promise.reject(new RecipientRequired(""));
  }

  let valid: boolean;
  try {
    // Optimistically assume params.currency.id is an actual Currency
    valid = isValidAddress(params.recipient, <Currency>params.currency.id);
  } catch (e: any) {
    // isValidAddress() will throw Error if c is not an actual Currency
    valid = false;
  }
  if (!valid) {
    return Promise.reject(
      new InvalidAddress("", {
        currencyName: params.currency.name,
      })
    );
  }
  return Promise.resolve(null);
};
export function isChangeOutput(output: BitcoinOutput): boolean {
  if (!output.path) return false;
  const p = output.path.split("/");
  return p[p.length - 2] === "1";
}

type UTXOStatus =
  | {
      excluded: true;
      reason: "pickUnconfirmedRBF" | "pickPendingNonRBF" | "userExclusion";
    }
  | {
      excluded: false;
    };
export const getUTXOStatus = (
  utxo: BitcoinOutput,
  utxoStrategy: UtxoStrategy
): UTXOStatus => {
  if (!utxoStrategy.pickUnconfirmedRBF && utxo.rbf && !utxo.blockHeight) {
    return {
      excluded: true,
      reason: "pickUnconfirmedRBF",
    };
  }
  if (!utxo.rbf && !utxo.blockHeight) {
    return {
      excluded: true,
      reason: "pickPendingNonRBF",
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
};

const bchExplicit = (str: string): string => {
  const explicit = str.includes(":") ? str : "bitcoincash:" + str;

  try {
    const { type } = cashaddr.decode(explicit);
    if (type === "P2PKH") return explicit;
  } catch (e) {
    // ignore errors
  }

  return str;
};

type CoinLogic = {
  hasExtraData?: boolean;
  hasExpiryHeight?: boolean;
  getAdditionals?: (arg0: { transaction: Transaction }) => string[];
  asExplicitTransactionRecipient?: (arg0: string) => string;
  onScreenTransactionRecipient?: (arg0: string) => string;
  postBuildBitcoinResources?: (
    arg0: Account,
    arg1?: BitcoinResources
  ) => BitcoinResources;
  syncReplaceAddress?: (addr: string) => string;
  injectGetAddressParams?: (arg0: Account) => any;
};

export const bchToCashaddrAddressWithoutPrefix = (recipient) =>
  recipient ? recipient.substring(recipient.indexOf(":") + 1) : recipient;

export const perCoinLogic: Record<
  CryptoCurrencyIds,
  CoinLogic | null | undefined
> = {
  zencash: {
    hasExtraData: true, // FIXME (legacy) investigate why we need this here and drop
  },
  zcash: {
    hasExtraData: true,
    hasExpiryHeight: true,
    getAdditionals: () => ["sapling"], // FIXME (legacy) drop in ledgerjs. we always use sapling now for zcash & kmd
  },
  komodo: {
    hasExtraData: true,
    hasExpiryHeight: true,
    getAdditionals: () => ["sapling"], // FIXME (legacy) drop in ledgerjs. we always use sapling now for zcash & kmd
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
    // Due to minimal support, we need to return the explicit format of bitcoincash:.. if it's a P2PKH
    asExplicitTransactionRecipient: bchExplicit,
    // to represent what happens on the device, which do not display the bitcoincash: prefix
    onScreenTransactionRecipient: (str: string): string => {
      const prefix = "bitcoincash:";
      return str.startsWith(prefix) ? str.slice(prefix.length) : str;
    },
    syncReplaceAddress: (addr) => bchToCashaddrAddressWithoutPrefix(addr),
    injectGetAddressParams: () => ({
      forceFormat: "cashaddr",
    }),
  },
};

// vvvvv DEPRECATED - used only by legacy libcore implementation vvvvv

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
