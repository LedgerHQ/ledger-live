import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type { AccountRawAssignHooks } from "../../bridge/generic-coin-framework/types";
import { migrateWalletAccount, readAccountState } from "./accountModule/state";
import { fromBitcoinOutputRaw, toBitcoinOutputRaw } from "./serialization";
import type { BitcoinAccount, BitcoinAccountRaw } from "./types";

function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const resources = (account as BitcoinAccount).bitcoinResources;
  if (!resources) return;
  // `walletAccount`, the legacy bridge's transaction store, is no longer written (ADR-065 D7)
  (accountRaw as BitcoinAccountRaw).bitcoinResources = {
    utxos: resources.utxos.map(toBitcoinOutputRaw),
    ...(resources.accountState ? { accountState: resources.accountState } : {}),
  };
}

/**
 * Restores the account resources; an account the legacy bridge persisted gets its state built from
 * the transaction store it carries, once, without a resync (ADR-065 M1).
 */
function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  const raw = (accountRaw as BitcoinAccountRaw).bitcoinResources;
  if (!raw) return;
  const accountState =
    readAccountState(raw.accountState) ??
    (raw.walletAccount
      ? migrateWalletAccount(raw.walletAccount, accountRaw.blockHeight ?? 0)
      : undefined);
  (account as BitcoinAccount).bitcoinResources = {
    utxos: (raw.utxos ?? []).map(fromBitcoinOutputRaw),
    ...(accountState ? { accountState } : {}),
  };
}

export default { assignToAccountRaw, assignFromAccountRaw } satisfies AccountRawAssignHooks;
