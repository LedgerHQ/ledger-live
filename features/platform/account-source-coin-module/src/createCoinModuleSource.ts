import {
  AccountDataNotServedError,
  DEFAULT_ACCOUNT_DATA_CONCURRENCY,
  type AccountDataBatchReader,
  type AccountDataReader,
  type AccountDataSource,
  type AccountTarget,
} from "@domain/api-account-data";
import type { AccountAssetBalance } from "@domain/entity-account-balance";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { currencyIdFromNetwork, type AccountDescriptor } from "@domain/entity-account-descriptor";
import type { CoinModuleHost } from "./host";
import { createLimiter } from "./internals/limiter";
import { toAccountBalances } from "./internals/toAccountBalances";

/** Accounts per batch call. */
const BALANCE_BATCH_SIZE = 10;

/** An account-based coin module reads the address, a utxo one the xpub. */
const subjectOf = (descriptor: AccountDescriptor) =>
  descriptor.type === "utxo" ? descriptor.xpub : descriptor.address;

const currencyIdOf = ({ descriptor }: AccountTarget) => currencyIdFromNetwork(descriptor.network);

/** Serves an account whose currency has a coin module, reading the coin module itself, with no bridge in between. */
export function createCoinModuleSource(host: CoinModuleHost): AccountDataSource {
  // Shared by every batch call: as many coin module calls in flight as single reads would allow.
  const limit = createLimiter(DEFAULT_ACCOUNT_DATA_CONCURRENCY);

  const supports = ({ type, network }: AccountDescriptor) => {
    try {
      const currencyId = currencyIdFromNetwork(network);
      return (
        host.isCurrencySupported(currencyId) &&
        (type !== "utxo" || host.readsXpub?.(currencyId) === true)
      );
    } catch {
      return false;
    }
  };

  // The accounts of one currency: its coin module loaded once, one settled answer per account.
  const readCurrency = async (
    currencyId: string,
    targets: readonly AccountTarget[],
  ): Promise<PromiseSettledResult<AccountAssetBalance[]>[]> => {
    const api = await host.getApi(currencyId);
    if (!api) {
      const notServed = new AccountDataNotServedError(
        `No balance read in the ${currencyId} coin module`,
      );
      return targets.map(() => ({ status: "rejected", reason: notServed }));
    }
    const blacklisted = new Set(host.blacklistedTokenIds?.());
    return Promise.allSettled(
      targets.map(async ({ descriptor }) =>
        toAccountBalances(
          currencyId,
          await limit(() => api.getBalance(subjectOf(descriptor))),
          api,
          blacklisted,
        ),
      ),
    );
  };

  const readBalances: AccountDataBatchReader<"balance"> = async targets => {
    const indexesByCurrency = new Map<string, number[]>();
    targets.forEach((target, index) => {
      const currencyId = currencyIdOf(target);
      indexesByCurrency.set(currencyId, [...(indexesByCurrency.get(currencyId) ?? []), index]);
    });
    const answers: PromiseSettledResult<AccountAssetBalance[]>[] = [];
    await Promise.all(
      [...indexesByCurrency].map(async ([currencyId, indexes]) => {
        const settled = await readCurrency(
          currencyId,
          indexes.map(index => targets[index]),
        ).catch((reason: unknown) => indexes.map(() => ({ status: "rejected" as const, reason })));
        indexes.forEach((index, position) => {
          answers[index] = settled[position];
        });
      }),
    );
    return answers;
  };

  const readBalance: AccountDataReader<"balance"> = async target => {
    const [answer] = await readBalances([target], undefined);
    if (answer.status === "rejected") throw answer.reason;
    return answer.value;
  };

  return {
    id: AccountDataSourceIdSchema.parse("coin-module"),
    supports,
    maxBatchSize: BALANCE_BATCH_SIZE,
    read: { balance: readBalance },
    readBatch: { balance: readBalances },
  };
}
