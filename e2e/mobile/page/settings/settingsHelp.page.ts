import * as path from "path";
import { FileUtils } from "../../utils/fileUtils";
import { urls } from "../../../../apps/ledger-live-mobile/src/utils/urls";

export default class SettingsHelpPage {
  exportLogsRowId = "export-logs-row";
  clearCacheRowId = "clear-cache-row";
  clearCacheButtonId = "clear-cache-button";

  ledgerSupportRowId = (url: string) => `ledger-support-row-${url}`;

  @Step("expect Ledger Support URL to be correct")
  async expectLedgerSupportUrlToBeCorrect() {
    const id = this.ledgerSupportRowId(urls.faq);
    await detoxExpect(getElementById(id)).toBeVisible();
  }

  @Step("Click on Export Logs Row")
  async clickOnExportLogsRow() {
    await waitForElementById(this.exportLogsRowId);
    await tapById(this.exportLogsRowId);
  }

  @Step("Verify logs are exported")
  async verifyLogsAreExported() {
    const fileName = "ledgerwallet-logs.txt";
    const filePath = path.resolve(__dirname, `../../artifacts/${fileName}`);

    const fileExists = await FileUtils.waitForFileToExist(filePath);
    jestExpect(fileExists).toBeTruthy();

    const logs = await FileUtils.readFileAsString(filePath);
    jestExpect(logs.length).toBeGreaterThan(0);
  }

  @Step("Click on Clear Cache Row")
  async clickOnClearCacheRow() {
    await waitForElementById(this.clearCacheRowId);
    await tapById(this.clearCacheRowId);
  }

  @Step("Check Clear Cache Modal is displayed")
  async checkClearCacheModalIsDisplayed() {
    await detoxExpect(getElementById(this.clearCacheButtonId)).toBeVisible();
  }

  @Step("Click on Clear Cache Button")
  async clickOnClearCacheButton() {
    await tapById(this.clearCacheButtonId);
  }
}
