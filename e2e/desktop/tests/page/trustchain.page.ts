import { expect } from "@playwright/test";
import { step } from "../misc/reporters/step";
import { LedgerSyncCliHelper } from "tests/utils/ledgerSyncCliUtils";
import { getTrustchainAccounts } from "tests/utils/ledgerSyncPulledDataUtils";

/**
 * Assertions on what a Ledger Sync trustchain holds, read through the CLI rather than the UI.
 * Every method pulls a fresh copy, so callers never juggle pulled payloads themselves.
 */
export class TrustchainPage {
  private async getAccounts() {
    return getTrustchainAccounts(await LedgerSyncCliHelper.pullLedgerSyncData());
  }

  @step("Expect trustchain to hold no account")
  async expectToBeEmpty() {
    expect(await this.getAccounts(), "Trustchain should not hold any account").toEqual([]);
  }

  @step("Expect trustchain to hold account $0 on $1")
  async expectToHoldAccount(accountId: string, currencyId: string, timeout = 60_000) {
    await expect
      .poll(async () => this.getAccounts(), { timeout })
      .toEqual([expect.objectContaining({ id: accountId, currencyId })]);
  }
}
