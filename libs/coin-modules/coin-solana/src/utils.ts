import { getEnv } from "@ledgerhq/live-env";
import {
  AccountInfo,
  Cluster,
  ConfirmedSignatureInfo,
  ParsedAccountData,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { partition } from "lodash/fp";
import { ValidatorsAppValidator } from "./network/validator-app";

const SIGNATURE_SIZE = 64;
const DUMMY_SIGNATURE_FILL = 1;
export const DUMMY_SIGNATURE = Buffer.alloc(SIGNATURE_SIZE, DUMMY_SIGNATURE_FILL);

// Hardcoding the Ledger validators info as backup,
// because backend is flaky and sometimes doesn't return it anymore
export const LEDGER_VALIDATOR_BY_FIGMENT: ValidatorsAppValidator = {
  voteAccount: "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx",
  name: "Ledger by Figment",
  avatarUrl:
    "https://s3.amazonaws.com/keybase_processed_uploads/3c47b62f3d28ecfd821536f69be82905_360_360.jpg",
  wwwUrl: "https://www.ledger.com/staking",
  activeStake: 8860644178046828,
  commission: 7,
  totalScore: 6,
  apy: 0.078107,
};

export const LEDGER_VALIDATOR_BY_CHORUS_ONE: ValidatorsAppValidator = {
  voteAccount: "CpfvLiiPALdzZTP3fUrALg2TXwEDSAknRh1sn5JCt9Sr",
  name: "Ledger by Chorus One",
  avatarUrl:
    "https://s3.amazonaws.com/keybase_processed_uploads/3c47b62f3d28ecfd821536f69be82905_360_360.jpg",
  wwwUrl: "https://www.ledger.com/staking",
  activeStake: 110738001000098,
  commission: 7,
  totalScore: 7,
  apy: 0.07228,
};

export const LEDGER_VALIDATOR_DEFAULT = LEDGER_VALIDATOR_BY_FIGMENT;

// default validator first
export const LEDGER_VALIDATOR_LIST: ValidatorsAppValidator[] = [
  LEDGER_VALIDATOR_BY_FIGMENT,
  LEDGER_VALIDATOR_BY_CHORUS_ONE,
];

export const LEDGER_VALIDATORS_VOTE_ACCOUNTS = LEDGER_VALIDATOR_LIST.map(v => v.voteAccount);

export const SOLANA_DELEGATION_RESERVE = 0.01;
export const SYSTEM_ACCOUNT_RENT_EXEMPT = 890880;

export const assertUnreachable = (_: never): never => {
  throw new Error("unreachable assertion failed");
};

export async function drainSeqAsyncGen<T>(...asyncGens: AsyncGenerator<T>[]): Promise<T[]> {
  const items: T[] = [];
  for (const gen of asyncGens) {
    for await (const item of gen) {
      items.push(item);
    }
  }
  return items;
}

export async function drainSeq<T>(jobs: (() => Promise<T>)[]) {
  const items: T[] = [];
  for (const job of jobs) {
    items.push(await job());
  }
  return items;
}

export function endpointByCurrencyId(currencyId: string): string {
  const endpoints: Record<string, string> = {
    solana: getEnv("API_SOLANA_PROXY"),
    solana_devnet: clusterApiUrl("devnet"),
    solana_testnet: clusterApiUrl("testnet"),
  };

  if (currencyId in endpoints) {
    return endpoints[currencyId];
  }

  throw Error(
    `unexpected currency id format <${currencyId}>, should be like solana[_(testnet | devnet)]`,
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

// move Ledger validators to the first positions
export function ledgerFirstValidators(
  validators: ValidatorsAppValidator[],
): ValidatorsAppValidator[] {
  const [ledgerValidators, restValidators] = partition(
    v => LEDGER_VALIDATORS_VOTE_ACCOUNTS.includes(v.voteAccount),
    validators,
  );

  const LEDGER_FIRST_VALIDATOR =
    ledgerValidators.find(v => v.voteAccount === LEDGER_VALIDATOR_DEFAULT.voteAccount) ||
    LEDGER_VALIDATOR_DEFAULT;

  const ledgerValidatorsFiltered = ledgerValidators.filter(
    v => v.voteAccount !== LEDGER_FIRST_VALIDATOR.voteAccount,
  );

  return ledgerValidators.length === 2
    ? [LEDGER_FIRST_VALIDATOR, ...ledgerValidatorsFiltered].concat(restValidators)
    : LEDGER_VALIDATOR_LIST.concat(restValidators);
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

function isConfirmedSignatureInfo(value: unknown): value is ConfirmedSignatureInfo {
  return (
    isUnknownObject(value) &&
    typeof value.signature === "string" &&
    typeof value.slot === "number" &&
    typeof value.err === "object" &&
    (value.memo === null || typeof value.memo === "string") &&
    (value.blockTime === null || typeof value.blockTime === "number") &&
    (value.confirmationStatus === null || typeof value.confirmationStatus === "string")
  );
}

export function isSignaturesForAddressResponse(
  value: unknown,
): value is { result: Array<ConfirmedSignatureInfo>; id: string } {
  return (
    isUnknownObject(value) &&
    typeof value.id === "string" &&
    Array.isArray(value.result) &&
    value.result.every(isConfirmedSignatureInfo)
  );
}
