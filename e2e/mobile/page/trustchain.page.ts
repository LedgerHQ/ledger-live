import { Step } from "jest-allure2-reporter/api";
import { LedgerSyncCliHelper } from "@ledgerhq/live-e2e-shared/ledgerSync/helper";
import {
  getTrustchainAccountName,
  getTrustchainAccounts,
  type LedgerSyncAccountData,
} from "@ledgerhq/live-e2e-shared/ledgerSync/pulledData";

const DEFAULT_TIMEOUT = 60_000;
const POLL_INTERVAL = 2_000;

const byName = (a: string, b: string) => a.localeCompare(b);

/**
 * Assertions on what a Ledger Sync trustchain holds, read through the CLI rather than the UI.
 * Every method pulls a fresh copy, so callers never juggle pulled payloads themselves.
 */
export default class TrustchainPage {
  private async getAccounts(): Promise<LedgerSyncAccountData[]> {
    return getTrustchainAccounts(await LedgerSyncCliHelper.pullLedgerSyncData());
  }

  private async getAccountName(accountId: string) {
    return getTrustchainAccountName(await LedgerSyncCliHelper.pullLedgerSyncData(), accountId);
  }

  /** The app pushes asynchronously, so the trustchain lags the UI by a poll interval or two. */
  private async waitUntil<T>(
    read: () => Promise<T>,
    matches: (value: T) => boolean,
    timeout: number,
  ) {
    const deadline = Date.now() + timeout;
    let last: T = await read();
    while (!matches(last) && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      last = await read();
    }
    return last;
  }

  @Step("Expect trustchain to hold no account")
  async expectToBeEmpty() {
    jestExpect(await this.getAccounts()).toEqual([]);
  }

  @Step("Expect trustchain to hold exactly the accounts $0")
  async expectAccountIds(accountIds: string[], timeout = DEFAULT_TIMEOUT) {
    const expected = accountIds.toSorted(byName);
    const actual = await this.waitUntil(
      async () => (await this.getAccounts()).map(account => account.id ?? "").toSorted(byName),
      ids => JSON.stringify(ids) === JSON.stringify(expected),
      timeout,
    );
    jestExpect(actual).toEqual(expected);
  }

  @Step("Expect trustchain to hold account $0 on $1")
  async expectToHoldAccount(accountId: string, currencyId: string, timeout = DEFAULT_TIMEOUT) {
    const accounts = await this.waitUntil(
      () => this.getAccounts(),
      list => list.length === 1 && list[0]?.id === accountId,
      timeout,
    );
    jestExpect(accounts).toEqual([jestExpect.objectContaining({ id: accountId, currencyId })]);
  }

  @Step("Expect account $0 to keep its default name in the trustchain")
  async expectAccountToHaveDefaultName(accountId: string) {
    jestExpect(await this.getAccountName(accountId)).toBeUndefined();
  }

  @Step("Expect account $0 to be named $1 in the trustchain")
  async expectAccountName(accountId: string, accountName: string, timeout = DEFAULT_TIMEOUT) {
    const name = await this.waitUntil(
      () => this.getAccountName(accountId),
      value => value === accountName,
      timeout,
    );
    jestExpect(name).toBe(accountName);
  }

  /** Deleting the backup destroys the last application stream, and with it the trustchain root. */
  @Step("Expect trustchain to be destroyed")
  async expectToBeDestroyed() {
    await jestExpect(LedgerSyncCliHelper.pullLedgerSyncData()).rejects.toMatchObject({
      name: jestExpect.stringMatching(
        /CloudSyncHttpError|LedgerAPI4xx|TrustchainEjected|TrustchainNotAllowed/,
      ),
    });
  }
}
