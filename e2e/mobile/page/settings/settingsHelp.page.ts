import { Step } from "jest-allure2-reporter/api";
import * as path from "path";
import { FileUtils } from "@e2e/utils/fileUtils";
import { byId } from "@e2e/helpers/elements/native";

export default class SettingsHelpPage {
  private readonly exportLogsRow = byId("export-logs-row");
  private readonly clearCacheRow = byId("clear-cache-row");
  private readonly clearCacheButton = byId("clear-cache-button");
  private readonly ledgerSupportRow = (url: string) => byId(`ledger-support-row-${url}`);

  @Step("expect Ledger Support URL to be correct")
  async expectLedgerSupportUrlToBeCorrect() {
    await this.ledgerSupportRow("https://support.ledger.com/").expectVisible();
  }

  @Step("Click on Export Logs Row")
  async clickOnExportLogsRow() {
    await this.exportLogsRow.tap();
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
    await this.clearCacheRow.tap();
  }

  @Step("Check Clear Cache Modal is displayed")
  async checkClearCacheModalIsDisplayed() {
    await this.clearCacheButton.expectVisible();
  }

  @Step("Click on Clear Cache Button")
  async clickOnClearCacheButton() {
    await this.clearCacheButton.tap();
  }
}
