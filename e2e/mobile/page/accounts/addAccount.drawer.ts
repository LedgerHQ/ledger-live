import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";
import CommonPage from "@e2e/page/common.page";
import { checkForErrorModals } from "@e2e/helpers/errorHelpers";
import { TIMEOUT } from "@e2e/utils/timeouts";
import { withTimeout } from "@e2e/utils/withTimeout";

// Long enough to outlast the drawer animation, short enough to not stall the variant that skips it.
const IMPORT_PROMPT_TIMEOUT = TIMEOUT.small;

// Full discovery on a fresh currency, dominated by the derivation scan.
const ACCOUNT_DISCOVERY_TIMEOUT = 240_000;

export default class AddAccountDrawer extends CommonPage {
  private readonly baseLink = "add-account";

  private readonly deselectAllButton = byId("add-accounts-deselect-all");
  private readonly modalButton = byId("add-accounts-modal-add-button");
  private readonly continueButton = byId("enabled-add-accounts-continue-button");
  private readonly accountOfCurrency = (currencyId: string) =>
    this.accountItem({ idPattern: `js:2:${currencyId}:.*` });

  @Step("Open add account via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Click on 'Import with your Ledger' button")
  async importWithYourLedger() {
    await this.modalButton.tap();
  }

  /**
   * The aggregated-assets portfolio opens the asset selector straight from its add-account CTA,
   * with no intermediate modal to import from, so the step only exists in the other variant.
   */
  @Step("Click on 'Import with your Ledger' button if asked")
  async importWithYourLedgerIfAsked() {
    if (await this.modalButton.isVisible(IMPORT_PROMPT_TIMEOUT)) {
      await this.modalButton.tap();
    }
  }

  @Step("Wait for accounts discovery")
  async waitAccountsDiscovery() {
    const startTime = Date.now();

    // disable sync to avoid Detox hanging during busy account discovery and UI animations
    await this.disableSynchronization();
    const poll = async (): Promise<void> => {
      if (Date.now() - startTime >= ACCOUNT_DISCOVERY_TIMEOUT) {
        throw new Error(
          `Account discovery timed out after ${ACCOUNT_DISCOVERY_TIMEOUT}ms. Expected the continue button to show.`,
        );
      }
      const visible = await withTimeout(
        this.continueButton.isVisible(TIMEOUT.medium),
        TIMEOUT.large,
        "waitAccountsDiscovery:continueButton",
      );
      if (visible) {
        return;
      }
      await withTimeout(
        checkForErrorModals(TIMEOUT.xxsmall, "Account discovery failed"),
        TIMEOUT.small,
        "waitAccountsDiscovery:errorModal",
        { rethrow: true },
      );
      return poll();
    };

    try {
      await poll();
    } finally {
      await this.enableSynchronization();
    }
  }

  @Step("Get number of accounts displayed by the blockchain scan")
  async getNumberOfScannedAccounts(): Promise<number> {
    await this.waitAccountsDiscovery();
    const scannedAccounts = await this.accountItem().count();
    if (scannedAccounts === 0) {
      throw new Error("No account found on the blockchain scan screen");
    }
    return scannedAccounts;
  }

  @Step("Finish account discovery")
  async finishAccountsDiscovery() {
    await this.continueButton.tap();
    await this.continueButton.waitNotVisible();
  }

  @Step("Expect account discovered {{{0}}}")
  async expectAccountDiscovery(currencyName: string, currencyId: string, index = 0) {
    await this.accountOfCurrency(currencyId).expectVisible();
    const accountId = (await this.accountItem({ index }).getIdentifier()).replace(
      this.accountItemId,
      "",
    );
    await this.accountItemName(accountId).expectText(currencyName);
    return accountId;
  }

  @Step("Close add account success screen")
  async tapCloseAddAccountCta() {
    await this.closeWithConfirmationButton.tap();
  }

  @Step("Add only discovered {{{0}}} account at index {{{2}}}")
  async addAccountAtIndex(currencyName: string, currencyId: string, index: number = 0) {
    await this.waitAccountsDiscovery();
    const accountCount = await this.accountItem().count();
    // A lone discovered account arrives already selected, so tapping it would clear the selection
    // and disable Confirm. Only the multi-account case needs deselecting and then picking one.
    if (accountCount > 1) {
      await this.deselectAllButton.tap();
      await this.accountItem({ index }).tap();
    }
    const accountId = await this.expectAccountDiscovery(currencyName, currencyId, index);
    await this.finishAccountsDiscovery();
    return accountId;
  }
}
