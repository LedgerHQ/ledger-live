import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { LedgerSyncCliHelper } from "@ledgerhq/live-e2e-shared/ledgerSync/helper";
import {
  getTrustchainAccountName,
  getTrustchainAccounts,
} from "@ledgerhq/live-e2e-shared/ledgerSync/pulledData";

/**
 * Assertions on what a Ledger Sync trustchain holds, read through the CLI rather than the UI.
 * Every method pulls a fresh copy, so callers never juggle pulled payloads themselves.
 */
export class TrustchainPage {
  private async getAccounts() {
    return getTrustchainAccounts(await LedgerSyncCliHelper.pullLedgerSyncData());
  }

  private async getAccountName(accountId: string) {
    return getTrustchainAccountName(await LedgerSyncCliHelper.pullLedgerSyncData(), accountId);
  }

  @step("Expect trustchain to hold no account")
  async expectToBeEmpty() {
    expect(await this.getAccounts(), "Trustchain should not hold any account").toEqual([]);
  }

  /** Deleting the backup destroys the last application stream, and with it the trustchain root. */
  @step("Expect trustchain to be destroyed")
  async expectToBeDestroyed() {
    await expect(
      LedgerSyncCliHelper.pullLedgerSyncData(),
      "Trustchain should no longer be reachable once the backup is deleted",
    ).rejects.toThrow();
  }

  @step("Expect trustchain to hold account $0 on $1")
  async expectToHoldAccount(accountId: string, currencyId: string, timeout = 60_000) {
    await expect
      .poll(async () => this.getAccounts(), { timeout })
      .toEqual([expect.objectContaining({ id: accountId, currencyId })]);
  }

  @step("Expect trustchain to hold exactly the accounts $0")
  async expectAccountIds(accountIds: string[], timeout = 60_000) {
    await expect
      .poll(
        async () =>
          (await this.getAccounts())
            .map(account => account.id ?? "")
            .sort((a, b) => a.localeCompare(b)),
        { timeout },
      )
      .toEqual(accountIds.toSorted((a, b) => a.localeCompare(b)));
  }

  @step("Expect account $0 to keep its default name in the trustchain")
  async expectAccountToHaveDefaultName(accountId: string) {
    expect(
      await this.getAccountName(accountId),
      "An account on its default name should not be stored in the trustchain account names",
    ).toBeUndefined();
  }

  @step("Expect account $0 to be named $1 in the trustchain")
  async expectAccountName(accountId: string, accountName: string, timeout = 60_000) {
    await expect.poll(async () => this.getAccountName(accountId), { timeout }).toBe(accountName);
  }
}
