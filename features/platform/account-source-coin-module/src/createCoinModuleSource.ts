import {
  AccountDataNotServedError,
  type AccountDataReader,
  type AccountDataSource,
} from "@domain/api-account-data";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { currencyIdFromNetwork, type AccountDescriptor } from "@domain/entity-account-descriptor";
import type { CoinModuleHost } from "./host";
import { toAccountBalances } from "./internals/toAccountBalances";

/** An account-based coin module reads the address, a utxo one the xpub. */
const subjectOf = (descriptor: AccountDescriptor) =>
  descriptor.type === "utxo" ? descriptor.xpub : descriptor.address;

/** Serves an account whose currency has a coin module, reading the coin module itself, with no bridge in between. */
export function createCoinModuleSource(host: CoinModuleHost): AccountDataSource {
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

  return {
    id: AccountDataSourceIdSchema.parse("coin-module"),
    supports,
    read: { balance: readBalance },
  };
}
