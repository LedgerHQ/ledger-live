import { Step } from "jest-allure2-reporter/api";
import { LedgerSyncCliHelper } from "@ledgerhq/live-e2e-shared/ledgerSync/helper";
import {
  getTrustchainAccountName,
  getTrustchainAccounts,
  type LedgerSyncAccountData,
} from "@ledgerhq/live-e2e-shared/ledgerSync/pulledData";
import { INTERVAL, TIMEOUT } from "@e2e/utils/timeouts";

const DEFAULT_TIMEOUT = TIMEOUT.xxlarge;
const POLL_INTERVAL = INTERVAL.long;

const byName = (a: string, b: string) => a.localeCompare(b);

type WaitUntilOptions<T> = {
  read: () => Promise<T>;
  matches: (value: T) => boolean;
  timeout: number;
};

type ExpectToHoldAccountOptions = {
  accountId: string;
  currencyId: string;
  timeout?: number;
};

type ExpectAccountNameOptions = {
  accountId: string;
  accountName: string;
  timeout?: number;
};

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
  private async waitUntil<T>(options: WaitUntilOptions<T>) {
    const { read, matches, timeout } = options;
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

  @Step("Expect trustchain to hold exactly the accounts {{{0}}}")
  async expectAccountIds(accountIds: string[], timeout = DEFAULT_TIMEOUT) {
    const expected = accountIds.toSorted(byName);
    const actual = await this.waitUntil({
      read: async () =>
        (await this.getAccounts()).map(account => account.id ?? "").toSorted(byName),
      matches: ids => JSON.stringify(ids) === JSON.stringify(expected),
      timeout,
    });
    jestExpect(actual).toEqual(expected);
  }

  @Step("Expect trustchain to hold account {{{0.accountId}}} on {{{0.currencyId}}}")
  async expectToHoldAccount(options: ExpectToHoldAccountOptions) {
    const { accountId, currencyId, timeout = DEFAULT_TIMEOUT } = options;
    const accounts = await this.waitUntil({
      read: () => this.getAccounts(),
      matches: list => list.length === 1 && list[0]?.id === accountId,
      timeout,
    });
    jestExpect(accounts).toEqual([jestExpect.objectContaining({ id: accountId, currencyId })]);
  }

  @Step("Expect account {{{0}}} to keep its default name in the trustchain")
  async expectAccountToHaveDefaultName(accountId: string) {
    jestExpect(await this.getAccountName(accountId)).toBeUndefined();
  }

  @Step("Expect account {{{0.accountId}}} to be named {{{0.accountName}}} in the trustchain")
  async expectAccountName(options: ExpectAccountNameOptions) {
    const { accountId, accountName, timeout = DEFAULT_TIMEOUT } = options;
    const name = await this.waitUntil({
      read: () => this.getAccountName(accountId),
      matches: value => value === accountName,
      timeout,
    });
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
