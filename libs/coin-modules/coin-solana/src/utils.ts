import { AccountInfo, Cluster, ParsedAccountData, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { partition } from "lodash/fp";
import { ValidatorsAppValidator } from "./network/validator-app";
import { type SolanaCoinConfig, type SolanaCurrencyId } from "./config";
import type { Config as ChainConfig } from "./network/chain";
import {
  DEFAULT_LEDGER_VALIDATORS,
  LEDGER_VALIDATOR_BY_FIGMENT,
  DEFAULT_BLOCKHASH_RETRIES,
  DEFAULT_BLOCKHASH_RETRY_DELAY_MS,
  DEFAULT_COMPUTE_UNIT_MARGIN,
  DEFAULT_TX_FEE,
} from "./constants";

const SIGNATURE_SIZE = 64;
const DUMMY_SIGNATURE_FILL = 1;
export const DUMMY_SIGNATURE = Buffer.alloc(SIGNATURE_SIZE, DUMMY_SIGNATURE_FILL);
// signatures provided by Solana are filled with 0
export const ZERO_FILLED_DUMMY_SIGNATURE = Buffer.alloc(DUMMY_SIGNATURE.length, 0);

export function transactionHasNonPlaceholderSignatures(
  signatures: ReadonlyArray<Uint8Array | Buffer>,
): boolean {
  if (signatures.length === 0) {
    return false;
  }
  for (const sig of signatures) {
    const sigBuf = Buffer.from(sig);
    if (!sigBuf.equals(ZERO_FILLED_DUMMY_SIGNATURE) && !sigBuf.equals(DUMMY_SIGNATURE)) {
      return true;
    }
  }
  return false;
}

export const SOLANA_DELEGATION_RESERVE = 0.01;

export const assertUnreachable = (_: never): never => {
  throw new Error("unreachable assertion failed");
};

export async function drainSeq<T>(jobs: (() => Promise<T>)[]) {
  const items: T[] = [];
  for (const job of jobs) {
    items.push(await job());
  }
  return items;
}

export function endpointByCurrencyId(config: SolanaCoinConfig, currencyId: string): string {
  if (!isSolanaCurrencyId(currencyId)) {
    throw Error(
      `unexpected currency id format <${currencyId}>, should be like solana[_(testnet | devnet)]`,
    );
  }

  const endpoint = config.rpcUrls?.[currencyId];
  if (!endpoint) {
    throw Error(`no rpcUrls.${currencyId} in the coin config of ${currencyId}`);
  }

  return endpoint;
}

export function feesOf(config: SolanaCoinConfig) {
  return {
    computeUnitMargin: config.fees?.computeUnitMargin ?? DEFAULT_COMPUTE_UNIT_MARGIN,
    defaultTxFee: config.fees?.defaultTxFee ?? DEFAULT_TX_FEE,
    blockhashRetries: config.fees?.blockhashRetries ?? DEFAULT_BLOCKHASH_RETRIES,
    blockhashRetryDelayMs: config.fees?.blockhashRetryDelayMs ?? DEFAULT_BLOCKHASH_RETRY_DELAY_MS,
  };
}

export function chainConfigFrom(config: SolanaCoinConfig, currencyId: string): ChainConfig {
  return {
    endpoint: endpointByCurrencyId(config, currencyId),
    confirmationTimeoutMs: config.broadcast?.timeoutMs,
    retries: config.node?.retries,
    retryDelayMs: config.node?.retryDelayMs,
  };
}

function isSolanaCurrencyId(currencyId: string): currencyId is SolanaCurrencyId {
  return (
    currencyId === "solana" || currencyId === "solana_devnet" || currencyId === "solana_testnet"
  );
}

export function clusterByCurrencyId(currencyId: string): Cluster {
  const clusters: Record<string, Cluster> = {
    solana: "mainnet-beta",
    solana_devnet: "devnet",
    solana_testnet: "testnet",
  };

  if (currencyId in clusters) {
    return clusters[currencyId];
  }

  throw Error(
    `unexpected currency id format <${currencyId}>, should be like solana[_(testnet | devnet)]`,
  );
}

export function defaultVoteAccAddrByCurrencyId(currencyId: string): string | undefined {
  const voteAccAddrs: Record<string, string | undefined> = {
    solana: undefined,
    solana_devnet: undefined,
    solana_testnet: undefined,
  };

  if (currencyId in voteAccAddrs) {
    return voteAccAddrs[currencyId];
  }

  throw new Error(
    `unexpected currency id format <${currencyId}>, should be like solana[_(testnet | devnet)]`,
  );
}

type AsyncQueueEntry<T> = {
  lazyPromise: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
};

export function asyncQueue(config: { delayBetweenRuns: number }): {
  submit: <T>(fn: () => Promise<T>) => Promise<T>;
} {
  const { delayBetweenRuns } = config;
  const q: AsyncQueueEntry<any>[] = [];

  const drain = async () => {
    if (q.length > 0) {
      const { lazyPromise, resolve, reject } = q[q.length - 1];
      try {
        resolve(await lazyPromise());
      } catch (e) {
        reject(e);
      } finally {
        void setTimeout(() => {
          q.pop();
          void drain();
        }, delayBetweenRuns);
      }
    }
  };

  const submit = <T>(lazyPromise: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      q.unshift({
        lazyPromise,
        resolve,
        reject,
      });

      if (q.length === 1) {
        void drain();
      }
    });
  };

  return {
    submit,
  };
}

export function swap(arr: any[], i: number, j: number) {
  const tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
}

export type Functions<T> = keyof {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

export function ledgerValidatorsOf(config: SolanaCoinConfig): ValidatorsAppValidator[] {
  return config.staking?.ledgerValidators ?? DEFAULT_LEDGER_VALIDATORS;
}

export function defaultLedgerValidatorOf(config: SolanaCoinConfig): ValidatorsAppValidator {
  return ledgerValidatorsOf(config)[0] ?? LEDGER_VALIDATOR_BY_FIGMENT;
}

// move Ledger validators to the first positions
export function ledgerFirstValidators(
  validators: ValidatorsAppValidator[],
  ledgerList: ValidatorsAppValidator[],
): ValidatorsAppValidator[] {
  const ledgerVoteAccounts = new Set(ledgerList.map(v => v.voteAccount));
  const [ledgerDefault] = ledgerList;
  const [ledgerValidators, restValidators] = partition(
    v => ledgerVoteAccounts.has(v.voteAccount),
    validators,
  );

  const LEDGER_FIRST_VALIDATOR =
    ledgerValidators.find(v => v.voteAccount === ledgerDefault?.voteAccount) || ledgerDefault;

  const ledgerValidatorsFiltered = ledgerValidators.filter(
    v => v.voteAccount !== LEDGER_FIRST_VALIDATOR?.voteAccount,
  );

  return ledgerValidators.length === ledgerList.length && LEDGER_FIRST_VALIDATOR
    ? [LEDGER_FIRST_VALIDATOR, ...ledgerValidatorsFiltered].concat(restValidators)
    : ledgerList.concat(restValidators);
}

export function profitableValidators(validators: ValidatorsAppValidator[]) {
  return validators.filter(v => v.commission < 100);
}

// https://stackoverflow.com/a/60132060
export const tupleOfUnion =
  <T>() =>
  <U extends T[]>(
    array: U & ([T] extends [U[number]] ? unknown : "The array must contain all union values"),
  ) =>
    array;

export function sweetch<T extends keyof any, R>(caze: T, cases: Record<T, R>): R {
  return cases[caze];
}

export function median(values: number[]): number {
  const length = values.length;
  if (!length) return 0;

  const sorted = values.sort((a, b) => a - b);
  const middle = Math.floor(length / 2);
  return length % 2
    ? BigNumber(sorted[middle])
        .plus(sorted[middle - 1])
        .div(2)
        .toNumber()
    : sorted[middle];
}

export function isParsedAccount(entry: {
  pubkey: PublicKey;
  account: AccountInfo<Buffer | ParsedAccountData>;
}): entry is {
  pubkey: PublicKey;
  account: AccountInfo<ParsedAccountData>;
} {
  return "parsed" in entry.account.data;
}

interface HistoryEntry {
  epoch: number;
  stakeHistory: {
    effective: number;
    activating: number;
    deactivating: number;
  };
}

type UnknownObject = Record<PropertyKey, unknown>;

function isUnknownObject(value: unknown): value is UnknownObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isHistoryEntry(value: unknown): value is HistoryEntry {
  return (
    isUnknownObject(value) &&
    typeof value.epoch === "number" &&
    isUnknownObject(value.stakeHistory) &&
    typeof value.stakeHistory.effective === "number" &&
    typeof value.stakeHistory.activating === "number" &&
    typeof value.stakeHistory.deactivating === "number"
  );
}
