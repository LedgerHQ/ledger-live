import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";
import { expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { FileUtils } from "tests/utils/fileUtils";

/** Values read from a history row before opening the operation drawer (must match drawer content). */
export type ClickedHistoryOperationSnapshot = {
  readonly typeLabel: string;
  /** Fiat countervalue as shown in the history "Value" column; matches drawer `operation-amount`. */
  readonly fiatAmountText: string;
  readonly operationId: string;
};

export class HistoryPage extends AppPage {
  // The CSV filename embeds the Playwright test id so that parallel workers and retries
  // never share the same path (see https://playwright.dev/docs/api/class-testinfo#test-info-test-id).
  // Keep this in sync with the path injected via `PLAYWRIGHT_EXPORT_CSV_PATH` in the e2e fixture.
  private static csvFilename(testId: string) {
    return `ledgerwallet-operations-${testId}.csv`;
  }
  private static exportSourcePath(testId: string) {
    return path.resolve(`./${HistoryPage.csvFilename(testId)}`);
  }
  private static exportArtifactPath(testId: string) {
    return path.resolve(__dirname, "../artifacts", HistoryPage.csvFilename(testId));
  }

  private readonly historyButton = this.page.getByTestId("topbar-action-button-history");
  private readonly historyPage = this.page.getByTestId("history-page");

  private readonly columnType = this.page.getByTestId("history-column-type");
  private readonly columnAddress = this.page.getByTestId("history-column-address");
  private readonly columnAmount = this.page.getByTestId("history-column-amount");
  private readonly columnValue = this.page.getByTestId("history-column-value");

  private readonly operationAddressTestId = "history-operation-address";
  private readonly operationAmountTestId = "history-operation-amount";

  private readonly operationRows = this.page.locator(`[data-testid^='history-operation-row-']`);
  private readonly operationType = this.page.getByTestId("history-operation-type");

  private readonly exportCsvButton = this.page.getByTestId("history-export-csv-button");
  private readonly exportDialog = this.page.getByTestId("history-export-dialog");
  private readonly exportFirstAccount = this.exportDialog.getByRole("checkbox").first();
  private readonly exportCsvConfirm = this.page.getByTestId("history-export-csv-confirm");
  private readonly exportSuccessTitle = this.page.getByTestId("history-export-success-title");
  private readonly exportDoneButton = this.page.getByRole("button", { name: /^done$/i });

  private async expectFirstHistoryRowRenders(options: {
    typeLabel: "Received" | "Sent";
    /** English UI (`history.address.from` / `to`) — default e2e fixture uses `en-US`. */
    addressPrefix: "From" | "To";
    amountSign: "+" | "-";
  }) {
    const { typeLabel, addressPrefix, amountSign } = options;
    const row = this.operationRows
      .filter({ has: this.operationType.filter({ hasText: typeLabel }) })
      .first();

    await expect(row).toBeVisible();

    const addressCell = row.getByTestId(this.operationAddressTestId);

    await expect(addressCell).toHaveText(new RegExp(`${addressPrefix}\\s*\\S`, "i"));

    const amountCell = row.getByTestId(this.operationAmountTestId);
    await expect(amountCell).toContainText(amountSign);
  }

  @step("Open history from top bar")
  async openFromTopBar() {
    await this.historyButton.click();
    await expect(this.page).toHaveURL(/\/history/);
  }

  @step("Expect history page to be visible")
  async expectHistoryPageVisible() {
    await expect(this.historyPage).toBeVisible();
  }

  @step("Expect four-column layout (Type, Address, Amount, Value)")
  async expectFourColumnLayout() {
    await expect(this.columnType).toHaveText("Type");
    await expect(this.columnAddress).toHaveText("Address");
    await expect(this.columnAmount).toHaveText("Amount");
    await expect(this.columnValue).toHaveText("Value");
  }

  @step("Expect row renders for IN operation")
  async expectRowRendersForIn() {
    await this.expectFirstHistoryRowRenders({
      typeLabel: "Received",
      addressPrefix: "From",
      amountSign: "+",
    });
  }

  @step("Expect row renders for OUT operation")
  async expectRowRendersForOut() {
    await this.expectFirstHistoryRowRenders({
      typeLabel: "Sent",
      addressPrefix: "To",
      amountSign: "-",
    });
  }

  @step("Click first operation row")
  async clickFirstOperationRow(): Promise<ClickedHistoryOperationSnapshot> {
    const firstRow = this.operationRows.first();
    const testIdAttr = await firstRow.getAttribute("data-testid");
    const prefix = "history-operation-row-";
    if (!testIdAttr?.startsWith(prefix)) {
      throw new Error(`Expected row data-testid "${prefix}*", got "${testIdAttr ?? "null"}"`);
    }
    const operationId = testIdAttr.slice(prefix.length);

    const typeLabel = (await firstRow.getByTestId("history-operation-type").textContent())!.trim();
    const fiatAmountText = (await firstRow.getByTestId("history-operation-value").innerText())
      .replace(/\s+/g, " ")
      .trim();

    await firstRow.click();
    return { typeLabel, fiatAmountText, operationId };
  }

  @step("Click Export CSV button")
  async clickExportCsv() {
    await this.exportCsvButton.click();
    await expect(this.exportDialog).toBeVisible();
  }

  @step("Select first account for export")
  async selectFirstAccountForExport() {
    await this.exportFirstAccount.click();
  }

  @step("Expect export button to be enabled")
  async expectExportButtonEnabled() {
    await expect(this.exportCsvConfirm).toBeEnabled();
  }

  @step("Confirm CSV export and wait for file (testId: $0)")
  async confirmExportCsvAndWaitForFile(testId: string) {
    await this.exportCsvConfirm.click();
    await FileUtils.waitForFileAndMove(
      HistoryPage.exportSourcePath(testId),
      HistoryPage.exportArtifactPath(testId),
    );
    await expect(this.exportSuccessTitle).toBeVisible();
    await expect(this.exportDoneButton).toBeVisible();
  }

  @step("Expect exported CSV contains data (testId: $0)")
  async expectExportedFileContents(testId: string) {
    const fileContents = await readFile(HistoryPage.exportArtifactPath(testId), "utf-8");

    expect(fileContents).toContain("Operation Date");
    expect(fileContents).toContain("Operation Hash");
    expect(fileContents).toContain("Account Name");
    expect(fileContents.trim().split(/\r?\n/).length).toBeGreaterThan(1);
  }

  @step("Close export success dialog")
  async closeExportSuccessDialog() {
    await this.exportDoneButton.click();
    await expect(this.exportSuccessTitle).not.toBeVisible();
  }

  @step("Close export dialog")
  async closeExportDialog() {
    await this.page.keyboard.press("Escape");
    await expect(this.exportDialog).not.toBeVisible();
  }
}
