import { device } from "detox";
import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import CommonPage from "@e2e/page/common.page";
import { retryUntilTimeout } from "@e2e/utils/retry";
import { checkForErrorModals } from "@e2e/helpers/errorHelpers";

// Short enough that retryUntilTimeout's own budget still allows a re-tap; the default 60s would
// consume the whole budget in a single attempt.
const CONTINUE_DISMISS_TIMEOUT = 5_000;

// Long enough to outlast the drawer animation, short enough to not stall the variant that skips it.
const IMPORT_PROMPT_TIMEOUT = 5_000;

export default class AddAccountDrawer extends CommonPage {
  baseLink = "add-account";
  deselectAllButtonId = "add-accounts-deselect-all";
  modalButtonId = "add-accounts-modal-add-button";
  continueButtonId = "enabled-add-accounts-continue-button";
  closeAddAccountButtonId = "button-close-add-account";

  accountIdAccountDrawer = (currency: string) => `js:2:${currency}:.*`;

  @Step("Open add account via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Click on 'Import with your Ledger' button")
  async importWithYourLedger() {
    await waitForElementById(this.modalButtonId);
    await tapById(this.modalButtonId);
  }

  /**
   * The aggregated-assets portfolio opens the asset selector straight from its add-account CTA,
   * with no intermediate modal to import from, so the step only exists in the other variant.
   */
  @Step("Click on 'Import with your Ledger' button if asked")
  async importWithYourLedgerIfAsked() {
    if (await IsIdVisible(this.modalButtonId, IMPORT_PROMPT_TIMEOUT)) {
      await tapById(this.modalButtonId);
    }
  }

  @Step("Wait for accounts discovery")
  async waitAccountsDiscovery() {
    const DISCOVERY_TIMEOUT = 240_000;
    const startTime = Date.now();

    // disable sync to avoid Detox hanging during busy account discovery and UI animations
    await device.disableSynchronization();
    try {
      while (Date.now() - startTime < DISCOVERY_TIMEOUT) {
        if (await IsIdVisible(this.continueButtonId, 10_000)) {
          return;
        }
        await checkForErrorModals(1_000, "Account discovery failed");
      }
      throw new Error(
        `Account discovery timed out after ${DISCOVERY_TIMEOUT}ms. Expected button "${this.continueButtonId}" not found.`,
      );
    } finally {
      await device.enableSynchronization();
    }
  }

  @Step("Get number of accounts displayed by the blockchain scan")
  async getNumberOfScannedAccounts(): Promise<number> {
    await this.waitAccountsDiscovery();
    const scannedAccounts = await countElements(getElementsById(this.accountItemRegExp()));
    if (scannedAccounts === 0) {
      throw new Error("No account found on the blockchain scan screen");
    }
    return scannedAccounts;
  }

  @Step("Finish account discovery")
  async finishAccountsDiscovery() {
    await retryUntilTimeout(async () => {
      await tapById(this.continueButtonId);
      const dismissed = await waitForElementNotVisible(
        this.continueButtonId,
        CONTINUE_DISMISS_TIMEOUT,
      );
      if (!dismissed) throw new Error(`${this.continueButtonId} still visible after tap`);
    });
  }

  @Step("Expect account discovered {{{0}}}")
  async expectAccountDiscovery(currencyName: string, currencyId: string, index = 0) {
    await detoxExpect(this.accountItem(this.accountIdAccountDrawer(currencyId))).toBeVisible();
    const accountId = (await getIdByRegexp(this.accountItemRegExp(), index)).replace(
      this.accountItemId,
      "",
    );
    await detoxExpect(this.accountItemName(accountId)).toHaveText(currencyName);
    return accountId;
  }

  @Step("Close add account success screen")
  async tapCloseAddAccountCta() {
    await waitForElementById(this.closeAddAccountButtonId);
    await tapById(this.closeAddAccountButtonId);
  }

  @Step("Add only discovered {{{0}}} account at index {{{2}}}")
  async addAccountAtIndex(currencyName: string, currencyId: string, index: number = 0) {
    await this.waitAccountsDiscovery();
    const accountCount = await countElementsById(this.accountItemRegExp());
    // A lone discovered account arrives already selected, so tapping it would clear the selection
    // and disable Confirm. Only the multi-account case needs deselecting and then picking one.
    if (accountCount > 1) {
      await tapById(this.deselectAllButtonId);
      await tapById(this.accountItemRegExp(), index);
    }
    const accountId = await this.expectAccountDiscovery(currencyName, currencyId, index);
    await this.finishAccountsDiscovery();
    return accountId;
  }
}
