import { Cluster } from "@solana/web3.js";

export const assertUnreachable = (_: never): never => {
  throw new Error("unreachable assertion failed");
};

export async function drainSeqAsyncGen<T>(
  ...asyncGens: AsyncGenerator<T>[]
): Promise<T[]> {
  const items: T[] = [];
  for (const gen of asyncGens) {
    for await (const item of gen) {
      items.push(item);
    }
  }
  return items;
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
    `unexpected currency id format <${currencyId}>, should be like solana[_(testnet | devnet)]`
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
