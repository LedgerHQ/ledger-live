import {
  abortReason,
  AccountDataNotServedError,
  type AccountDataReader,
  type AccountDataSource,
} from "@domain/api-account-data";
import { AccountDataSourceIdSchema, type AccountDataKind } from "@domain/entity-account-data";
import { currencyIdFromNetwork, type AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountExistence } from "@domain/entity-account-existence";
import type { CoinModuleHost } from "./host";
import { toAccountBalances } from "./internals/toAccountBalances";
import { readOperationsPage } from "./internals/readOperationsPage";

/** An account-based coin module reads the address, a utxo one the xpub. */
const subjectOf = (descriptor: AccountDescriptor) =>
  descriptor.type === "utxo" ? descriptor.xpub : descriptor.address;

/** Serves an account whose currency has a coin module, reading the coin module itself, with no bridge in between. */
export function createCoinModuleSource(host: CoinModuleHost): AccountDataSource {
  const supports = ({ type, network }: AccountDescriptor, kind: AccountDataKind) => {
    try {
      const currencyId = currencyIdFromNetwork(network);
      return (
        host.isCurrencySupported(currencyId) &&
        (type !== "utxo" || host.readsXpub?.(currencyId) === true) &&
        (kind !== "operations" || host.paginatesOperations?.(currencyId) === true)
      );
    } catch {
      return false;
    }
  };

  const readBalance: AccountDataReader<"balance"> = async ({ descriptor }) => {
    const currencyId = currencyIdFromNetwork(descriptor.network);
    const api = await host.getApi(currencyId);
    if (!api) {
      throw new AccountDataNotServedError(`No balance read in the ${currencyId} coin module`);
    }
    return toAccountBalances(
      currencyId,
      await api.getBalance(subjectOf(descriptor)),
      api,
      new Set(host.blacklistedTokenIds?.()),
    );
  };

  const readOperations: AccountDataReader<"operations"> = async ({ descriptor, cursor }, query) => {
    const currencyId = currencyIdFromNetwork(descriptor.network);
    const api = await host.getOperationsApi?.(currencyId);
    if (!api) {
      throw new AccountDataNotServedError(`No operations read in the ${currencyId} coin module`);
    }
    return readOperationsPage(api, {
      currencyId,
      subject: subjectOf(descriptor),
      cursor,
      limit: query?.limit,
      filterAsset: query?.filterAsset,
      blacklistedTokenIds: new Set(host.blacklistedTokenIds?.()),
    });
  };

  // A module without `exists` hands the account to the next source, the full sync.
  const readExistence: AccountDataReader<"existence"> = async ({
    descriptor,
    signal,
  }): Promise<AccountExistence> => {
    const currencyId = currencyIdFromNetwork(descriptor.network);
    const api = await host.getExistenceApi?.(currencyId);
    if (signal?.aborted) throw abortReason(signal);
    if (!api) {
      throw new AccountDataNotServedError(`No existence check in the ${currencyId} coin module`);
    }
    return { used: await api.exists(subjectOf(descriptor)) };
  };

  return {
    id: AccountDataSourceIdSchema.parse("coin-module"),
    supports,
    read: { balance: readBalance, operations: readOperations, existence: readExistence },
  };
}
