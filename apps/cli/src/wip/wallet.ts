// WalletAdapter: routes wallet operations to the right compatibility adapter.
// No DMK, no device management — purely wallet & account concerns.
// All returned types are serializable (see models.ts).

import { Observable } from "rxjs";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { AccountDescriptor, Balance } from "./models";
import { BridgeAdapter } from "./compatibility/bridge";
import { AlpacaAdapter } from "./compatibility/alpaca";
import type { OperationsPage } from "./compatibility/alpaca";

export class WalletAdapter {
  private static readonly alpacaFamilies = new Set(["evm", "xrp", "stellar", "tezos"]);
  private readonly bridge = new BridgeAdapter();
  private readonly alpaca = new AlpacaAdapter();
  /**
   * Discover all accounts for a given currency on the connected device.
   * deviceId is the USB HID path (or "" for the first detected device).
   *
   * FUTURE: replace deviceId with a generic `deriveKey` callback once the DMK
   * abstraction lands, so this layer stays device-transport-agnostic.
   */
  discoverAccounts(currencyId: string, deviceId: string): Observable<AccountDescriptor> {
    return this.bridge.discoverAccounts(currencyId, deviceId);
  }

  /**
   * Return all balances (native + tokens) for the given account descriptor.
   * Uses Alpaca for supported families (fast direct API); falls back to full bridge sync.
   */
  async getAccountBalances(descriptor: AccountDescriptor): Promise<Balance[]> {
    const { family } = getCryptoCurrencyById(descriptor.currencyId);
    if (WalletAdapter.alpacaFamilies.has(family)) return this.alpaca.getBalances(descriptor);
    return this.bridge.getBalances(descriptor);
  }

  /**
   * Return a page of operations for the given account.
   * Uses Alpaca for supported families (paginated, no full sync); falls back to bridge sync.
   * cursor: pagination token from a previous call's result, omit for the first page.
   */
  async getAccountOperations(
    descriptor: AccountDescriptor,
    options?: { cursor?: string; limit?: number },
  ): Promise<OperationsPage> {
    const { family } = getCryptoCurrencyById(descriptor.currencyId);
    if (WalletAdapter.alpacaFamilies.has(family))
      return this.alpaca.getOperations(descriptor, options);
    return { operations: await this.bridge.getOperations(descriptor), nextCursor: undefined };
  }

  /**
   * Return the current receive address for the account.
   * Always uses bridge sync to ensure the freshest unused address.
   */
  async getFreshAddress(descriptor: AccountDescriptor): Promise<string> {
    return this.bridge.getFreshAddress(descriptor);
  }
}
