import {
  AccountDataNotServedError,
  type AccountDataReader,
  type AccountDataSource,
} from "@domain/api-account-data";
import { AccountDataSourceIdSchema, type AccountDataKind } from "@domain/entity-account-data";
import { currencyIdFromNetwork, type AccountDescriptor } from "@domain/entity-account-descriptor";
import type { CoinModuleHost } from "./host";
import { toAccountBalances } from "./internals/toAccountBalances";
import { readOperationsPage } from "./internals/readOperationsPage";

/** Serves an account whose currency has a coin module, reading the coin module itself, with no bridge in between. */
export function createCoinModuleSource(host: CoinModuleHost): AccountDataSource {
  /** An account-based coin module reads the address, a utxo one the xpub. */
  const subjectOf = async ({ type, network, key }: AccountDescriptor) =>
    type === "utxo" || !host.addressOf ? key : host.addressOf(currencyIdFromNetwork(network), key);

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
      await api.getBalance(await subjectOf(descriptor)),
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
      subject: await subjectOf(descriptor),
      cursor,
      limit: query?.limit,
      filterAsset: query?.filterAsset,
      blacklistedTokenIds: new Set(host.blacklistedTokenIds?.()),
    });
  };

  return {
    id: AccountDataSourceIdSchema.parse("coin-module"),
    supports,
    read: { balance: readBalance, operations: readOperations },
  };
}
