import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/account";

/** Drops wallet-btc's cached transactions and cursor, so the next sync fetches the whole transparent history again. */
export function forgetSyncedHistory(logger: Logger, walletAccount: WalletAccount): void {
  const { storage } = walletAccount.xpub;
  const exported = storage.exportSync();
  const addressCache =
    exported && typeof exported === "object" && "addressCache" in exported
      ? exported.addressCache
      : {};
  storage.loadSync(logger, { txs: [], addressCache });
  walletAccount.xpub.syncedBlockHeight = -1;
}
