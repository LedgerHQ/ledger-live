import cashaddr from "cashaddrjs";
import { Currency, isValidAddress } from "./wallet-btc";
import { RecipientRequired, InvalidAddress } from "@ledgerhq/errors";
import type {
  BitcoinOutput,
  BitcoinResources,
  Transaction,
  NetworkInfo,
  UtxoStrategy,
  BtcOperation,
} from "./types";
import { $Shape } from "utility-types";
import type { TX, Input as WalletInput, Output as WalletOutput } from "./wallet-btc";
import { BigNumber } from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import type { Account, OperationType } from "@ledgerhq/types-live";

// correspond ~ to min relay fees but determined empirically for a tx to be accepted by network
const minFees: Partial<Record<CryptoCurrencyId | "LBRY" | "groestcoin" | "osmo", number>> = {
  bitcoin: 1000,
  bitcoin_gold: 1000,
  qtum: 4000,
  stratis: 2000,
};
export const getMinRelayFee = (currency: CryptoCurrency): number => minFees[currency.id] || 0;
export const inferFeePerByte = (t: Transaction, networkInfo: NetworkInfo): BigNumber => {
  if (t.feesStrategy) {
    const speed = networkInfo.feeItems.items.find(item => t.feesStrategy === item.speed);

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
  } catch {
    // isValidAddress() will throw Error if c is not an actual Currency
    valid = false;
  }
  if (!valid) {
    return Promise.reject(
      new InvalidAddress("", {
        currencyName: params.currency.name,
      }),
    );
  }
  return Promise.resolve(null);
};
type UTXOStatus =
  | {
      excluded: true;
      reason: "pickPendingUtxo" | "userExclusion";
    }
  | { excluded: false; reason?: undefined };

export const getUTXOStatus = (utxo: BitcoinOutput, utxoStrategy: UtxoStrategy): UTXOStatus => {
  if (!utxo.blockHeight && !utxo.isChange) {
    // exclude pending and not change utxo
    return {
      excluded: true,
      reason: "pickPendingUtxo",
    };
  }
  if (
    utxoStrategy.excludeUTXOs.some(u => u.hash === utxo.hash && u.outputIndex === utxo.outputIndex)
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
  } catch {
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
  postBuildBitcoinResources?: (arg0: Account, arg1?: BitcoinResources) => BitcoinResources;
  syncReplaceAddress?: (addr: string) => string;
  injectGetAddressParams?: (arg0: Account) => any;
};

export const bchToCashaddrAddressWithoutPrefix = (recipient: string): string =>
  recipient ? recipient.substring(recipient.indexOf(":") + 1) : recipient;

export const perCoinLogic: Partial<
  Record<CryptoCurrencyId | "LBRY" | "groestcoin" | "osmo", CoinLogic>
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
    syncReplaceAddress: addr => bchToCashaddrAddressWithoutPrefix(addr),
    injectGetAddressParams: () => ({
      forceFormat: "cashaddr",
    }),
  },
};

/**
 * Derives a transaction sequence number (nonce) from a list of account inputs.
 *
 * This is used to compute the `transactionSequenceNumber` for Bitcoin-like UTXO transactions.
 *
 * - Only inputs that belong to the current account are considered (`accountInputs`)
 * - If an input is missing a `sequence`, it is assumed to be `0xfffffffe` (the default used by Bitcoin Core)
 *   - See: https://bitcoin.stackexchange.com/questions/48384/why-bitcoin-core-creates-time-locked-transactions-by-default
 *   - See: https://learnmeabitcoin.com/technical/transaction/input/sequence/
 * - The sequence number returned is the **minimum** among all inputs (most conservative RBF/locktime signal)
 *
 * ### Rationale:
 * - In Bitcoin, `nSequence = 0xffffffff` disables both RBF and locktime
 * - `nSequence < 0xffffffff` enables locktime, and may signal RBF (if any input does, the whole tx is replaceable per BIP 125)
 * - Using the minimum allows accurate inference of RBF/locktime behavior based on account-controlled inputs
 * - If no inputs are present (e.g., receive-only or watch-only tx), returns `undefined`
 *
 * @param accountInputs - The list of transaction inputs owned by the user's account
 * @returns The derived transaction sequence number, or `undefined` if no relevant inputs
 */
export function inferTransactionSequenceNumberFromInputs(
  accountInputs: Array<{ sequence?: number }>,
): number | undefined {
  if (accountInputs.length === 0) return undefined;
  return Math.min(...accountInputs.map(input => input.sequence ?? 0xfffffffe));
}

export const mapTxToOperations = (
  tx: TX,
  currencyId: CryptoCurrencyId | "LBRY" | "groestcoin" | "osmo",
  accountId: string,
  accountAddresses: Set<string>,
  changeAddresses: Set<string>,
): $Shape<BtcOperation[]> => {
  const operations: BtcOperation[] = [];
  const txId = tx.id;
  const fee = new BigNumber(tx.fees ?? 0);
  const blockHeight = tx.block?.height;
  const blockHash = tx.block?.hash;
  const date = new Date(tx.block?.time || tx.received_at);
  const senders = new Set<string>();
  const recipients: string[] = [];
  let type: OperationType = "OUT";
  let value = new BigNumber(0);
  const hasFailed = false;
  const accountInputs: WalletInput[] = [];
  const accountOutputs: WalletOutput[] = [];
  const syncReplaceAddress = perCoinLogic[currencyId]?.syncReplaceAddress;
  const inputs = new Set<`${string}-${number}`>(); // txid-outputIndex

  for (const input of tx.inputs) {
    inputs.add(`${input.output_hash}-${input.output_index}`);
    if (input.address) {
      senders.add(syncReplaceAddress ? syncReplaceAddress(input.address) : input.address);

      if (input.value) {
        if (accountAddresses.has(input.address)) {
          // This address is part of the account
          value = value.plus(input.value);
          accountInputs.push(input);
        }
      }
    }
  }

  const transactionSequenceNumber = new BigNumber(
    inferTransactionSequenceNumberFromInputs(accountInputs) || 0,
  );

  const hasSpentNothing = value.eq(0);

  // Change output is always the last one
  const changeOutputIndex =
    tx.outputs.length === 0
      ? 0
      : tx.outputs.map(o => o.output_index).reduce((p, c) => (p > c ? p : c));

  for (const output of tx.outputs) {
    // ledger explorer returns "unknown" as recipient for OP_RETURN outputs, we don't want to display it in our UI
    if (output.address && !output.address.includes("unknown")) {
      if (!accountAddresses.has(output.address)) {
        // The output doesn't belong to this account
        if (
          accountInputs.length > 0 && // It's a SEND operation
          (tx.outputs.length === 1 || // The transaction has only 1 output
            output.output_index < changeOutputIndex) // The output isn't the change output
        ) {
          recipients.push(syncReplaceAddress ? syncReplaceAddress(output.address) : output.address);
        }
      } else {
        // The output belongs to this account
        accountOutputs.push(output);

        if (!changeAddresses.has(output.address)) {
          // The output isn't a change output of this account
          recipients.push(syncReplaceAddress ? syncReplaceAddress(output.address) : output.address);
        } else {
          // The output is a change output of this account,
          // we count it as a recipient only in some special cases
          if (
            (recipients.length === 0 && output.output_index >= changeOutputIndex) ||
            hasSpentNothing
          ) {
            recipients.push(
              syncReplaceAddress ? syncReplaceAddress(output.address) : output.address,
            );
          }
        }
      }
    }
  }

  if (accountInputs.length > 0) {
    // It's a SEND operation
    for (const output of accountOutputs) {
      if (changeAddresses.has(output.address)) {
        value = value.minus(output.value);
      }
    }

    type = "OUT";
    operations.push({
      id: encodeOperationId(accountId, txId, type),
      hash: txId,
      type,
      value,
      fee,
      senders: Array.from(senders),
      recipients,
      blockHeight,
      blockHash,
      transactionSequenceNumber,
      accountId,
      date,
      hasFailed,
      extra: { inputs: Array.from(inputs) },
    });
  }

  if (accountOutputs.length > 0) {
    // It's a RECEIVE operation
    const filterChangeAddresses = !!accountInputs.length;
    let accountOutputCount = 0;
    let finalAmount = new BigNumber(0);

    for (const output of accountOutputs) {
      if (!filterChangeAddresses || !changeAddresses.has(output.address)) {
        finalAmount = finalAmount.plus(output.value);
        accountOutputCount += 1;
      }
    }

    if (accountOutputCount > 0) {
      value = finalAmount;
      type = "IN";
      operations.push({
        id: encodeOperationId(accountId, txId, type),
        hash: txId,
        type,
        value,
        fee,
        senders: Array.from(senders),
        recipients,
        blockHeight,
        blockHash,
        transactionSequenceNumber,
        accountId,
        date,
        hasFailed,
        extra: { inputs: Array.from(inputs) },
      });
    }
  }

  return operations;
};
