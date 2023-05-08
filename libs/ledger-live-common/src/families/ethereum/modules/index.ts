import values from "lodash/values";
import type { Account, Operation, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../types";
import type { DeviceTransactionField } from "../../../transaction";
// maintained union of all the modules
import * as erc20 from "./erc20";
import * as send from "./send";
import * as erc721 from "./erc721";
import * as erc1155 from "./erc1155";
import type { Modes as ERC20Modes } from "./erc20";
import type { Modes as SendModes } from "./send";
import type { Modes as ERC721Modes } from "./erc721";
import type { Modes as ERC1155Modes } from "./erc1155";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { ResolutionConfig } from "@ledgerhq/hw-app-eth/lib/services/types";

const modules = {
  erc20,
  send,
  erc721,
  erc1155,
};
export type TransactionMode =
  | ERC20Modes
  | SendModes
  | ERC721Modes
  | ERC1155Modes;

/**
 * A ModeModule enable a new transaction mode in Ethereum family
 * for instance --mode send
 * You have to implement 4 functions that are all the specifics for this mode.
 * Each of these functions are named "fill*" and are MUTABLE style functions where you have to fill the last parameter of the function
 * A mode is exposed from within a module (as part of the potential hooks the module need to expose)
 * the rest of the implementation of Ethereum will be quite generic (deal with general concepts like sync, signature, gas,..)
 */
export type ModeModule = {
  /**
   * enable the possibility to complete the TransactionStatus,
   * typically to add status.errors and status.warnings in order to implement form validation
   * NB: the TransactionStatus is already filled with generic data in it
   */
  fillTransactionStatus: (
    arg0: Account,
    arg1: Transaction,
    arg2: TransactionStatus
  ) => void;

  /**
   * enable the possibility to complete an object "TxData" that is the INPUT of the library ethereumjs-tx
   * NB: the TransactionStatus is already filled with generic data in it
   * That TxData will then be used to serialize the transaction and sign it with the device
   */
  fillTransactionData: (
    arg0: Account,
    arg1: Transaction,
    arg2: TxData
  ) => {
    erc20contracts?: string[];
  } | void;

  /**
   * enable the possibility to complete the "Device validation step" of the UI of LL
   * it implements the extra field that the given mode will display on the device
   */
  fillDeviceTransactionConfig: (
    input: {
      account: AccountLike;
      parentAccount: Account | null | undefined;
      transaction: Transaction;
      status: TransactionStatus;
    },
    fields: DeviceTransactionField[]
  ) => void;

  /**
   * enable the possibility to complete the optimistic operation resulted of a broadcast
   * NB: the Operation is already filled with the generic part, a mode might typically change the type, add subOperations,...
   */
  fillOptimisticOperation: (
    arg0: Account,
    arg1: Transaction,
    arg2: Operation
  ) => void;

  /**
   * hook to resolve a transaction like the prepareTransaction of the bridge
   */
  prepareTransaction?: (
    account: Account,
    transaction: Transaction
  ) => Promise<Transaction>;

  /**
   * tells what needs to be resolved in the transaction
   */
  getResolutionConfig?: (
    account: Account,
    transaction: Transaction
  ) => ResolutionConfig;
};
export const modes: Record<TransactionMode, ModeModule> = {} as Record<
  TransactionMode,
  ModeModule
>;

function loadModes() {
  for (const k in modules) {
    const m = modules[k];

    if (m.modes) {
      for (const j in m.modes) {
        modes[j] = m.modes[j];
      }
    }
  }
}

loadModes();
export async function preload(
  currency: CryptoCurrency
): Promise<Record<string, any>> {
  const value = {};

  for (const k in modules) {
    const m = modules[k];

    if (m.preload) {
      value[k] = await m.preload(currency);
    }
  }

  return value;
}
export function hydrate(value: unknown, currency: CryptoCurrency): void {
  if (!value || typeof value !== "object") return;

  for (const k in value) {
    if (k in modules) {
      const m = modules[k];

      if (m.hydrate) {
        m.hydrate(value[k], currency);
      }
    }
  }
}
export const prepareTransaction = (
  account: Account,
  transaction: Transaction
): Promise<Transaction> =>
  values(modules)
    // @ts-expect-error some module implement it
    .map((m) => m.prepareTransaction)
    .filter(Boolean)
    .reduce(
      (p, fn) => p.then((t) => fn(account, t)),
      Promise.resolve(transaction)
    );

type BufferLike = Buffer | string | number;
// this type is from transactionjs-tx
interface TxData {
  /**
   * The transaction's gas limit.
   */
  gasLimit?: BufferLike;

  /**
   * The transaction's gas price.
   */
  gasPrice?: BufferLike;

  /**
   * The transaction's the address is sent to.
   */
  to?: BufferLike;

  /**
   * The transaction's nonce.
   */
  nonce?: BufferLike;

  /**
   * This will contain the data of the message or the init of a contract
   */
  data?: BufferLike;

  /**
   * EC recovery ID.
   */
  v?: BufferLike;

  /**
   * EC signature parameter.
   */
  r?: BufferLike;

  /**
   * EC signature parameter.
   */
  s?: BufferLike;

  /**
   * The amount of Ether sent.
   */
  value?: BufferLike;
}
