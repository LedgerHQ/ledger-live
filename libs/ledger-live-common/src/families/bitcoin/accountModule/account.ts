import type { AccountData } from "@ledgerhq/account-module-framework";
import { conflictingTransactions, type UtxoAccountState } from "@ledgerhq/account-module-utxo";
import type { Account } from "@ledgerhq/types-live";
import {
  accountDataOf,
  toAccountOperation,
} from "../../../bridge/generic-coin-framework/accountModule";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";
import { bitcoinAccountModuleBinding } from "./binding";
import { bitcoinAccountModuleOf } from "./module";

/** What the account module knows of a bitcoin account. */
export const bitcoinAccountData = (account: Account): AccountData<UtxoAccountState> =>
  accountDataOf(bitcoinAccountModuleBinding, account) as AccountData<UtxoAccountState>;

/** The account's next change address — where a cancel sends the funds back. */
export async function getNextChangeAddress(
  account: Account,
): Promise<{ address: string; path: string }> {
  const currencyId = account.currency.id;
  const module = await bitcoinAccountModuleOf(currencyId);
  const { address, derivationPath } = await module.getChangeAddress(
    buildContext(currencyId),
    bitcoinAccountData(account),
  );
  return { address, path: derivationPath };
}

/** The addresses of the account, as shown. */
export async function getOwnDisplayAddresses(account: Account): Promise<Set<string>> {
  const currencyId = account.currency.id;
  const module = await bitcoinAccountModuleOf(currencyId);
  const addresses = await module.getAddresses(
    buildContext(currencyId),
    bitcoinAccountData(account),
  );
  return new Set(addresses.map(a => a.address));
}

/** Pending transactions of the account, other than `txid`, spending one of `outpoints`. */
export function conflictingTxIds(account: Account, txid: string, outpoints: Set<string>): string[] {
  const operations = [...account.pendingOperations, ...account.operations];
  return conflictingTransactions(
    operations.map(op => toAccountOperation(op, false)),
    txid,
    outpoints,
  );
}
