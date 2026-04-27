// WalletAdapter: routes wallet operations to the right compatibility adapter.
// No DMK, no device management — purely wallet & account concerns.
// All returned types are serializable (see models.ts).

import { Observable, from } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { AccountDescriptor, Balance, SendEvent, DiscoveredAccount } from "./models";
// BridgeAdapter and AlpacaAdapter are loaded lazily via dynamic import() inside getters
// to avoid pulling in live-common/bridge/index (~328ms) and alpaca/local/evm (~105ms)
// at module load time for every subprocess regardless of which command is invoked.
import type { BridgeAdapter } from "./compatibility/bridge";
import type { AlpacaAdapter, OperationsPage } from "./compatibility/alpaca";
import type { TransactionIntent } from "./intents";
import type { Network } from "../shared/accountDescriptor";
import { currencyIdFromNetwork, toV1 } from "../shared/accountDescriptor";

export class WalletAdapter {
  private static readonly alpacaFamilies = new Set(["evm"]);
  private _bridge: Promise<BridgeAdapter> | null = null;
  private _alpaca: Promise<AlpacaAdapter> | null = null;

  private getBridge(): Promise<BridgeAdapter> {
    return (this._bridge ??= import("./compatibility/bridge")
      .then(({ BridgeAdapter: B }) => new B())
      .catch(error => {
        this._bridge = null;
        throw error;
      }));
  }

  private getAlpaca(): Promise<AlpacaAdapter> {
    return (this._alpaca ??= import("./compatibility/alpaca")
      .then(({ AlpacaAdapter: A }) => new A())
      .catch(error => {
        this._alpaca = null;
        throw error;
      }));
  }
  /**
   * Discover all accounts for the given network on the connected device.
   * Returns V1 descriptors plus the fresh receive address for each account.
   * deviceId is the live-common device id (or "" for the first detected device).
   */
  discoverAccounts(network: Network, deviceId: string): Observable<DiscoveredAccount> {
    const currencyId = currencyIdFromNetwork(network);
    return from(this.getBridge()).pipe(
      switchMap(bridge =>
        bridge
          .discoverAccounts(currencyId, deviceId)
          .pipe(map(v0 => ({ descriptor: toV1(v0), freshAddress: v0.freshAddress }))),
      ),
    );
  }

  /**
   * Return all balances (native + tokens) for the given account descriptor.
   * Uses Alpaca for supported families (fast direct API); falls back to full bridge sync.
   */
  async getAccountBalances(descriptor: AccountDescriptor): Promise<Balance[]> {
    const { family } = getCryptoCurrencyById(descriptor.currencyId);
    if (WalletAdapter.alpacaFamilies.has(family))
      return (await this.getAlpaca()).getBalances(descriptor);
    return (await this.getBridge()).getBalances(descriptor);
  }

  /**
   * Return a page of operations for the given account.
   *
   * NOTE: Alpaca is temporarily bypassed for all families — always uses bridge sync.
   * Alpaca has known correctness issues (missing internal ops, questionable pagination
   * reliability) that need investigation before re-enabling. `cursor` is not supported
   * in bridge mode (bridge always returns the full history); `limit` slices the result.
   *
   * Re-enable Alpaca once validated:
   *   const { family } = getCryptoCurrencyById(descriptor.currencyId);
   *   if (WalletAdapter.alpacaFamilies.has(family))
   *     return this.alpaca.getOperations(descriptor, options);
   */
  async getAccountOperations(
    descriptor: AccountDescriptor,
    options?: { cursor?: string; limit?: number },
  ): Promise<OperationsPage> {
    const ops = await (await this.getBridge()).getOperations(descriptor);
    const limited = options?.limit == null ? ops : ops.slice(0, options.limit);
    return { operations: limited, nextCursor: undefined };
  }

  /**
   * Return the current receive address for the account.
   * Always uses bridge sync to ensure the freshest unused address.
   */
  async getFreshAddress(descriptor: AccountDescriptor): Promise<string> {
    return (await this.getBridge()).getFreshAddress(descriptor);
  }

  async verifyAddress(descriptor: AccountDescriptor, deviceId: string): Promise<string> {
    return (await this.getBridge()).verifyAddress(descriptor, deviceId);
  }

  /**
   * Prepare a transaction without signing — sync + build + validate only.
   * Use this for dry-run mode to avoid opening the device.
   */
  async prepareSend(
    descriptor: AccountDescriptor,
    intent: TransactionIntent,
  ): Promise<{ amount: string; fees: string; recipient: string }> {
    return (await this.getBridge()).prepareSend(descriptor, intent);
  }

  send(
    descriptor: AccountDescriptor,
    intent: TransactionIntent,
    deviceId: string,
    dryRun = false,
  ): Observable<SendEvent> {
    return from(this.getBridge()).pipe(
      switchMap(bridge => bridge.send(descriptor, intent, deviceId, dryRun)),
    );
  }
}
