import type { AccountData } from "@ledgerhq/account-module-framework";
import { conflictingTransactions, type UtxoAccountState } from "@ledgerhq/account-module-utxo";
import { requireExtension } from "@ledgerhq/portfolio-module-framework";
import type { Account } from "@ledgerhq/types-live";
import {
  accountDataOf,
  toAccountOperation,
} from "../../../bridge/generic-coin-framework/accountModule";
import { getCoinModuleApi } from "../../../bridge/generic-coin-framework/api";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";
import {
  openAccountPortfolio,
  type AccountPortfolio,
} from "../../../bridge/generic-coin-framework/portfolio/account";
import { isPortfolioEnabledFor } from "../../../bridge/generic-coin-framework/portfolio/config";
import { accountSource } from "../../../bridge/generic-coin-framework/portfolio/intentApi";
import { bitcoinAccountModuleBinding } from "./binding";
import { bitcoinAccountModuleOf } from "./module";

/** What the account module knows of a bitcoin account. */
export const bitcoinAccountData = (account: Account): AccountData<UtxoAccountState> =>
  accountDataOf(bitcoinAccountModuleBinding, account) as AccountData<UtxoAccountState>;

/**
 * The portfolio of a bitcoin account, opened for a write: the local side holds the account, seeded
 * from its module state and its operations. The reads of one edit share it.
 */
export type BitcoinWritePortfolio = Pick<
  AccountPortfolio,
  "portfolio" | "reader" | "portfolioId" | "network"
> & {
  accountId: string;
  /** The account key the portfolio knows the account by (its xpub). */
  key: string;
};

/**
 * The account's portfolio, opened for a write, when the coin config of its currency enables the
 * portfolio layer (`portfolio.enabled`); null on the legacy path.
 */
export async function bitcoinWritePortfolioOf(
  account: Account,
): Promise<BitcoinWritePortfolio | null> {
  const currencyId = account.currency.id;
  if (!isPortfolioEnabledFor(currencyId)) return null;
  const source = accountSource(bitcoinAccountModuleBinding, account);
  const { portfolio, reader, portfolioId, network } = await openAccountPortfolio(
    source,
    {
      binding: bitcoinAccountModuleBinding,
      coinModuleApi: await getCoinModuleApi(currencyId, "local"),
      context: buildContext(currencyId),
      // No token, catalog lookup nor balance option on a bitcoin-like family.
      bridgeApi: {},
    },
    "write",
  );
  return { portfolio, reader, portfolioId, network, accountId: source.accountId, key: source.key };
}

/**
 * `opened` is the account's write portfolio an edit already resolved (`bitcoinWritePortfolioOf`):
 * null on the legacy path, resolved here when undefined.
 */
const resolved = async (
  account: Account,
  opened: BitcoinWritePortfolio | null | undefined,
): Promise<BitcoinWritePortfolio | null> =>
  opened === undefined ? bitcoinWritePortfolioOf(account) : opened;

/**
 * The account's next change address — where a cancel sends the funds back. Through the portfolio
 * when it serves the account: the account read goes to the side holding it (the local side in
 * `local` mode, without asking the service).
 */
export async function getNextChangeAddress(
  account: Account,
  opened?: BitcoinWritePortfolio | null,
): Promise<{ address: string; path: string }> {
  const served = await resolved(account, opened);
  if (served) {
    const { reader, portfolioId, accountId } = served;
    const { address, derivation_path } = await requireExtension(reader, "getChangeAddress")(
      portfolioId,
      accountId,
    );
    return { address, path: derivation_path };
  }
  const currencyId = account.currency.id;
  const module = await bitcoinAccountModuleOf(currencyId);
  const { address, derivationPath } = await module.getChangeAddress(
    buildContext(currencyId),
    bitcoinAccountData(account),
  );
  return { address, path: derivationPath };
}

/** The addresses of the account, as shown. */
export async function getOwnDisplayAddresses(
  account: Account,
  opened?: BitcoinWritePortfolio | null,
): Promise<Set<string>> {
  const served = await resolved(account, opened);
  if (served) {
    const { reader, portfolioId, accountId } = served;
    const { items } = await requireExtension(reader, "getAccountAddresses")(portfolioId, accountId);
    return new Set(items.map(a => a.address));
  }
  const currencyId = account.currency.id;
  const module = await bitcoinAccountModuleOf(currencyId);
  const addresses = await module.getAddresses(
    buildContext(currencyId),
    bitcoinAccountData(account),
  );
  return new Set(addresses.value.map(a => a.address));
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
