import { Cluster, clusterApiUrl } from "@solana/web3.js";
import { partition } from "lodash/fp";
import { getEnv } from "@ledgerhq/live-env";
import { ValidatorsAppValidator } from "./validator-app";

// Hardcoding the Ledger validator info as backup,
// because backend is flaky and sometimes doesn't return it anymore
export const LEDGER_VALIDATOR: ValidatorsAppValidator = {
  voteAccount: "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx",
  name: "Ledger by Figment",
  avatarUrl:
    "https://s3.amazonaws.com/keybase_processed_uploads/3c47b62f3d28ecfd821536f69be82905_360_360.jpg",
  wwwUrl: "https://www.ledger.com/staking",
  activeStake: 4784119000000000,
  commission: 7,
  totalScore: 6,
};

export const SOLANA_DELEGATION_RESERVE = 0.01;

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
    solana: LEDGER_VALIDATOR.voteAccount,
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
  /* eslint-disable-next-line @typescript-eslint/ban-types*/
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

// move Ledger validator to the first position
export function ledgerFirstValidators(
  validators: ValidatorsAppValidator[],
): ValidatorsAppValidator[] {
  const [ledgerValidator, restValidators] = partition(
    v => v.voteAccount === LEDGER_VALIDATOR.voteAccount,
    validators,
  );
  return ledgerValidator.length
    ? ledgerValidator.concat(restValidators)
    : [LEDGER_VALIDATOR].concat(restValidators);
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
