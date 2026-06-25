import { log } from "@ledgerhq/logs";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type {
  Balance,
  BalanceOptions,
  CoinModuleApi,
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  computeA4AccountVersion,
  deriveA4AccountId,
  normalizeAccountKey,
} from "./accountId";
import { A4Client, A4HttpError } from "./client";
import { adaptBalances, adaptOperations } from "./adapters";

type Delegate = CoinModuleApi<any> & BridgeApi;

export type A4Options = {
  /** When true, read balances/operations from A4. When false, only register (data stays on delegate). */
  read: boolean;
  /** A4 base URL for this chain (without the trailing `/{network}` segment). */
  endpoint: string;
};

/**
 * Wrap a `local`/`remote` coin module (`delegate`) so balances and operations are served by the
 * A4 indexer, while every write operation, `lastBlock`, and staking stays on the delegate.
 *
 * A4 is the single source of truth: **no registration state is cached locally**. Every call is
 * optimistic and reacts to A4's response (ADR-040):
 * - account does not exist (`404`) → create + add addresses, then retry;
 * - account version mismatch (`412`, e.g. datacenter roaming) → re-add addresses, then retry;
 * - not yet indexed (`422`), `5xx`, transport error → transparently fall back to the delegate.
 * In register-only mode (`read: false`) it registers during sync, reads from the delegate, and any
 * A4 failure is logged and swallowed.
 */
export function createA4CoinModuleApi(
  network: string,
  delegate: Delegate,
  options: A4Options,
): Delegate {
  const client = new A4Client(network, options.endpoint);

  /**
   * Addresses to register for an account. Account-based chains register their single address;
   * UTXO chains must expand the xpub into its derived addresses (not yet supported here, as
   * generic-coin-framework only enables account-based families today — see ADR-040 R3.3).
   */
  function addressesFor(address: string): string[] {
    // Normalize the same way as the account id / version so the addresses we register match the
    // key the server hashes its version from (EVM hex lowercased, other keys kept verbatim).
    return [normalizeAccountKey(address)];
  }

  async function register(
    accountId: string,
    addresses: string[],
  ): Promise<string | undefined> {
    await client.createAccount(accountId);
    // addAddresses happens last, so its response carries the server's authoritative version.
    const { version } = await client.addAddresses(accountId, addresses);
    return version;
  }

  /**
   * React to an A4 error by registering (404) or reconciling addresses (412). Returns whether it
   * acted and the server's authoritative version (so the retry can use it instead of the locally
   * computed one — the server may compute a different version after roaming/re-registration).
   */
  async function reconcile(
    status: number | undefined,
    accountId: string,
    addresses: string[],
  ): Promise<{ reconciled: boolean; version?: string }> {
    if (status === 404) {
      return { reconciled: true, version: await register(accountId, addresses) };
    }
    if (status === 412) {
      const { version } = await client.addAddresses(accountId, addresses);
      return { reconciled: true, version };
    }
    return { reconciled: false };
  }

  /** Run an A4 read optimistically; reconcile + retry once on 404/412, else fall back to the delegate. */
  async function readWithFailover<T>(
    address: string,
    read: (accountId: string, ifVersion: string) => Promise<T>,
    fallback: () => Promise<T>,
  ): Promise<T> {
    const accountId = deriveA4AccountId(address);
    const addresses = addressesFor(address);
    const ifVersion = computeA4AccountVersion(addresses);
    try {
      return await read(accountId, ifVersion);
    } catch (error) {
      const status = error instanceof A4HttpError ? error.status : undefined;
      try {
        const { reconciled, version } = await reconcile(
          status,
          accountId,
          addresses,
        );
        if (reconciled) {
          // Retry with the server-returned version when available; the locally computed one is
          // only a guess and is exactly what triggered the 412 in the first place.
          return await read(accountId, version ?? ifVersion);
        }
      } catch (retryError) {
        log("a4", "reconcile + retry failed, falling back to delegate", {
          error:
            retryError instanceof Error
              ? retryError.message
              : String(retryError),
        });
      }
      log("a4", "read failed, falling back to delegate", { status });
      return fallback();
    }
  }

  /** Optimistically poll A4 and register/reconcile if needed. Errors are swallowed (register-only mode). */
  async function registerInBackground(address: string): Promise<void> {
    const accountId = deriveA4AccountId(address);
    const addresses = addressesFor(address);
    const ifVersion = computeA4AccountVersion(addresses);
    try {
      await client.getAccount(accountId, ifVersion);
    } catch (error) {
      const status = error instanceof A4HttpError ? error.status : undefined;
      try {
        await reconcile(status, accountId, addresses);
      } catch (reconcileError) {
        log("a4", "background registration failed", {
          error:
            reconcileError instanceof Error
              ? reconcileError.message
              : String(reconcileError),
        });
      }
    }
  }

  async function getBalance(
    address: string,
    balanceOptions?: BalanceOptions,
  ): Promise<Balance[]> {
    if (!options.read) {
      await registerInBackground(address);
      return delegate.getBalance(address, balanceOptions);
    }
    return readWithFailover(
      address,
      async (accountId, ifVersion) => {
        const { data } = await client.getBalances(accountId, ifVersion);
        const a4Balances = adaptBalances(data, address);
        // A4 does not index staking yet: keep stake-bearing balances coming from the delegate.
        if (!delegate.stakingSupported) return a4Balances;
        const delegateBalances = await delegate
          .getBalance(address, balanceOptions)
          .catch(() => []);
        return [
          ...a4Balances,
          ...delegateBalances.filter((b) => b.stake !== undefined),
        ];
      },
      () => delegate.getBalance(address, balanceOptions),
    );
  }

  async function listOperations(
    address: string,
    operationsOptions: ListOperationsOptions,
  ): Promise<Page<Operation>> {
    if (!options.read) {
      await registerInBackground(address);
      return delegate.listOperations(address, operationsOptions);
    }
    return readWithFailover(
      address,
      async (accountId, ifVersion) => {
        const { data } = await client.listOperations(
          accountId,
          {
            minHeight: operationsOptions.minHeight,
            cursor: operationsOptions.cursor,
          },
          ifVersion,
        );
        return {
          items: adaptOperations(data.items, address),
          next: data.next?.cursor,
        };
      },
      () => delegate.listOperations(address, operationsOptions),
    );
  }

  return {
    ...delegate,
    getBalance,
    listOperations,
  };
}
