// WalletAdapter: routes wallet operations to the right compatibility adapter.
// No DMK, no device management — purely wallet & account concerns.
// All returned types are serializable (see models.ts).

import { Observable, from } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { AccountDescriptor, Balance, SendEvent, DiscoveredAccountRaw } from "./models";
// BridgeAdapter and CoinFrameworkAdapter are loaded lazily via dynamic import() inside getters
// to avoid pulling in live-common/bridge/index (~328ms) and coinframework/local/evm (~105ms)
// at module load time for every subprocess regardless of which command is invoked.
import type { BridgeAdapter } from "./compatibility/bridge";
import type { CoinFrameworkAdapter, OperationsPage } from "./compatibility/coinframework";
import type { Operation } from "./models";
import type { EarnSolanaStake } from "./earn/types";
import type { TransactionIntent } from "./intents";
import type { Network } from "../shared/accountDescriptor";
import { currencyIdFromNetwork, toV1 } from "../shared/accountDescriptor";
import { readDescriptorBalances, readDescriptorOperations } from "./accountData";

export class WalletAdapter {
  private _bridge: Promise<BridgeAdapter> | null = null;
  private _coinFramework: Promise<CoinFrameworkAdapter> | null = null;

  private getBridge(): Promise<BridgeAdapter> {
    return (this._bridge ??= import("./compatibility/bridge")
      .then(({ BridgeAdapter: B }) => new B())
      .catch(error => {
        this._bridge = null;
        throw error;
      }));
  }

  private getCoinFramework(): Promise<CoinFrameworkAdapter> {
    return (this._coinFramework ??= import("./compatibility/coinframework")
      .then(({ CoinFrameworkAdapter: A }) => new A())
      .catch(error => {
        this._coinFramework = null;
        throw error;
      }));
  }
  /**
   * Discover all accounts for the given network on the connected device.
   * Returns V1 descriptors plus the fresh receive address for each account.
   * deviceId is the live-common device id (or "" for the first detected device).
   */
  discoverAccounts(network: Network, deviceId: string): Observable<DiscoveredAccountRaw> {
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
   *
   * Routed through `@features/platform-account-data`: the highest-priority source that supports the
   * account answers — a single `getBalance` on a family with a granular coin module, a full bridge
   * sync on the others. The per-family decision that used to live in this method is now a declared
   * `supports` (see `GRANULAR_FAMILIES` in `./accountData`), the same shape the wallet apps use.
   */
  async getAccountBalances(descriptor: AccountDescriptor): Promise<Balance[]> {
    const rows = await readDescriptorBalances(descriptor);
    return rows.map(row => ({ assetId: row.assetId, balance: row.balance }));
  }

  /**
   * Return a page of operations for the given account.
   *
   * NOTE: coin-framework is bypassed for all families here — always bridge sync. It has known
   * correctness issues on this path (missing internal ops, questionable pagination reliability) that
   * need investigation first. `cursor` is not supported in bridge mode (the bridge always returns the
   * full history); `limit` slices the result.
   *
   * This is exactly why the capability is per datum and not per family: `balance` goes granular
   * (see `getAccountBalances`) while `operations` stays on the bridge, for the same family, with no
   * contradiction. The read now goes through `@features/platform-account-data` all the same — its
   * source list simply has one entry. Re-enabling the granular path is a second entry in
   * `accountOperationsSources`, not a change here.
   */
  async getAccountOperations(
    descriptor: AccountDescriptor,
    options?: { cursor?: string; limit?: number },
  ): Promise<OperationsPage> {
    const rows = await readDescriptorOperations(descriptor);
    const operations = rows.map(row => ({
      id: row.id,
      hash: row.hash,
      type: row.type as Operation["type"],
      value: row.value,
      fee: row.fee,
      senders: row.senders,
      recipients: row.recipients,
      blockHeight: row.blockHeight,
      accountId: row.accountId,
      assetId: row.assetId,
      date: row.date,
      // The CLI's `parentId` means "an internal operation of this transaction". The entity links
      // every nested row to its parent, token transfers included, and the two are told apart by the
      // account they landed on: an internal operation stays on the main account, a token transfer
      // moves to the token account. Reconstructing the legacy field from the flat model rather than
      // widening it is the whole argument for the flat model.
      ...(row.parentOperationId && row.accountId === descriptor.id
        ? { parentId: row.parentOperationId }
        : {}),
    })) as Operation[];
    const limited = options?.limit == null ? operations : operations.slice(0, options.limit);
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
   * On-chain Solana stake accounts for the account (via full bridge sync). Each carries the
   * stake-account address `earn withdraw --stake-account` needs, plus delegation + activation state.
   */
  async getSolanaStakes(descriptor: AccountDescriptor): Promise<EarnSolanaStake[]> {
    return (await this.getBridge()).getSolanaStakes(descriptor);
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
    options: { deviceId: string; deviceModelId: DeviceModelId },
  ): Observable<SendEvent> {
    return from(this.getBridge()).pipe(
      switchMap(bridge => bridge.send(descriptor, intent, options)),
    );
  }
}
