import fs from "fs";
import type { DerivationMode } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { claimLocalNodeFunds } from "@ledgerhq/live-common/localNode/faucet";
import { Account, TokenAccount } from "./enum/Account";
import { runCliLiveData } from "./runCli";
import { sleep } from "./index";

/** Native units airdropped to an account before it is seeded: plenty for any e2e amount and fees. */
const LOCAL_NODE_FUNDING_AMOUNT = 10;
/** How long the local explorer gets to index the funding: the sync is retried until then. */
const LOCAL_NODE_SYNC_ATTEMPTS = 12;
const LOCAL_NODE_SYNC_INTERVAL_MS = 5000;

type AppJsonAccount = {
  data: { id: string; index: number; freshAddressPath: string; balance: string };
};
type AppJson = { data: { accounts: AppJsonAccount[] } };

const localNodeCurrencies = (): ReadonlySet<string> =>
  new Set(
    (process.env.LEDGER_LOCAL_NODE ?? "")
      .split(",")
      .map(id => id.trim())
      .filter(Boolean),
  );

/** Whether `account`'s currency runs on its coin-sandbox local node in this run (`LEDGER_LOCAL_NODE`). */
export const runsOnLocalNode = (account: Account | TokenAccount): boolean =>
  localNodeCurrencies().has((account.parentAccount ?? account).currency.id);

const readAppJson = (userdataPath: string): AppJson =>
  JSON.parse(fs.readFileSync(userdataPath, "utf-8"));

/**
 * Funds `account` (its parent for a token account) on its local node, then adds it to the app.json
 * at `userdataPath`.
 *
 * The account is synced by its id rather than scanned from the device: a local chain only knows
 * what happened since it started, so a scan returns whichever account was funded there first, in
 * derivation-mode order, not necessarily this one. The sync is retried until the local explorer has
 * indexed the funding.
 */
export async function seedOnLocalNode(
  account: Account | TokenAccount,
  address: string,
  userdataPath: string,
) {
  const main = account.parentAccount ?? account;
  const currencyId = main.currency.id;
  await claimLocalNodeFunds(
    { family: getCryptoCurrencyById(currencyId).family, network: currencyId, address },
    LOCAL_NODE_FUNDING_AMOUNT,
  );

  const id = encodeAccountId({
    type: "js",
    version: "2",
    currencyId,
    xpubOrAddress: address,
    derivationMode: (main.derivationMode ?? "") as DerivationMode,
  });
  for (let attempt = 1; attempt <= LOCAL_NODE_SYNC_ATTEMPTS; attempt++) {
    await runCliLiveData({ id, add: true, appjson: userdataPath });

    const appJson = readAppJson(userdataPath);
    const seeded = appJson.data.accounts.find(({ data }) => data.id === id);
    if (seeded && seeded.data.balance !== "0") {
      // A sync by id knows no index: give the account the one its name and path come from
      seeded.data.index = main.index;
      seeded.data.freshAddressPath = main.accountPath;
      fs.writeFileSync(userdataPath, JSON.stringify(appJson), "utf-8");
      return;
    }

    appJson.data.accounts = appJson.data.accounts.filter(({ data }) => data.id !== id);
    fs.writeFileSync(userdataPath, JSON.stringify(appJson), "utf-8");
    await sleep(LOCAL_NODE_SYNC_INTERVAL_MS);
  }
  throw new Error(
    `${main.accountName} (${address}) was funded on its local node, but its explorer never showed it: is it indexing?`,
  );
}
