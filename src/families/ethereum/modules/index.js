// @flow
import values from "lodash/values";
import type {
  CryptoCurrency,
  TokenAccount,
  Account,
  TransactionStatus,
  Operation,
  AccountLike,
} from "../../../types";
import type { Transaction } from "../types";
import type { DeviceTransactionField } from "../../../transaction";

// maintained union of all the modules
import * as compound from "./compound";
import * as erc20 from "./erc20";
import * as send from "./send";
import type { Modes as CompoundModes } from "./compound";
import type { Modes as ERC20Modes } from "./erc20";
import type { Modes as SendModes } from "./send";
const modules = { erc20, compound, send };
export type TransactionMode = CompoundModes | ERC20Modes | SendModes;

/**
 * A ModeModule enable a new transaction mode in Ethereum family
 * for instance --mode send or --mode compound.supply
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
  fillTransactionStatus: (Account, Transaction, TransactionStatus) => void,
  /**
   * enable the possibility to complete an object "TxData" that is the INPUT of the library ethereumjs-tx
   * NB: the TransactionStatus is already filled with generic data in it
   * That TxData will then be used to serialize the transaction and sign it with the device
   */
  fillTransactionData: (
    Account,
    Transaction,
    TxData
  ) => { erc20contracts?: string[] } | void,
  /**
   * enable the possibility to complete the "Device validation step" of the UI of LL
   * it implements the extra field that the given mode will display on the device
   */
  fillDeviceTransactionConfig: (
    input: {
      account: AccountLike,
      parentAccount: ?Account,
      transaction: Transaction,
      status: TransactionStatus,
    },
    fields: DeviceTransactionField[]
  ) => void,
  /**
   * enable the possibility to complete the optimistic operation resulted of a broadcast
   * NB: the Operation is already filled with the generic part, a mode might typically change the type, add subOperations,...
   */
  fillOptimisticOperation: (Account, Transaction, Operation) => void,
};

export const modes: { [_: TransactionMode]: ModeModule } = {};

function loadModes() {
  for (let k in modules) {
    const m = modules[k];
    if (m.modes) {
      for (let j in m.modes) {
        // $FlowFixMe
        modes[j] = m.modes[j];
      }
    }
  }
}

loadModes();

export async function preload(currency: CryptoCurrency): Promise<Object> {
  const value = {};
  for (let k in modules) {
    const m = modules[k];
    if (m.preload) {
      value[k] = await m.preload(currency);
    }
  }
  return value;
}

export function hydrate(value: mixed, currency: CryptoCurrency) {
  if (!value || typeof value !== "object") return;
  for (let k in value) {
    if (k in modules) {
      const m = modules[k];
      if (m.hydrate) {
        m.hydrate(value[k], currency);
      }
    }
  }
}

export const prepareTokenAccounts = (
  currency: CryptoCurrency,
  subAccounts: TokenAccount[],
  address: string
): Promise<TokenAccount[]> =>
  values(modules)
    .map((m) => m.prepareTokenAccounts)
    .filter(Boolean)
    .reduce(
      (p, fn) => p.then((s) => fn(currency, s, address)),
      Promise.resolve(subAccounts)
    );

export const digestTokenAccounts = (
  currency: CryptoCurrency,
  subAccounts: TokenAccount[],
  address: string
): Promise<TokenAccount[]> =>
  values(modules)
    .map((m) => m.digestTokenAccounts)
    .filter(Boolean)
    .reduce(
      (p, fn) => p.then((s) => fn(currency, s, address)),
      Promise.resolve(subAccounts)
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
