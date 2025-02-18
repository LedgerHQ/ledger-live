import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { expect } from "@playwright/test";

export class DelegateDrawer extends Drawer {
  private provider = (provider: string) =>
    this.page.getByTestId("drawer-content").locator(`text=${provider}`);
  private amountValue = this.page.getByTestId("amountReceived-drawer");
  private transactionType = this.page.getByTestId("transaction-type");
  private operationType = this.page.getByTestId("operation-type");
  private addressValue = (address: string) =>
    this.page.locator('[data-testid="drawer-content"]').locator(`text=${address}`);

  @step("Verify address $0 is visible")
  async addressValueIsVisible(address: string) {
    await expect(this.addressValue(address)).toBeVisible();
  }

  @step("Verify provider is visible")
  async providerIsVisible(account: Delegate) {
    if (account.account.currency === Currency.ATOM) {
      await expect(this.provider(account.provider)).toBeVisible();
    }
  }

  @step("Verify amount is visible")
  async amountValueIsVisible(ticker: string) {
    await expect(this.amountValue).toBeVisible();
    const displayedAmount = await this.amountValue.innerText();
    expect(displayedAmount).toEqual(expect.stringContaining(ticker));
  }

  @step("Verify transaction type is correct")
  async verifyTxTypeIsVisible() {
    await expect(this.transactionType).toBeVisible();
  }

  @step("Verify transaction type corresponds to $0")
  async verifyTxTypeIs(transactionType: string) {
    const transaction = await this.transactionType.allInnerTexts();
    expect(transaction).toContain(transactionType);
  }

  @step("Verify operation type corresponds to $0")
  async operationTypeIsCorrect(operationType: string) {
    const operation = await this.operationType.allInnerTexts();
    expect(operation).toContain(operationType);
  }

  @step("Verify that the information of the delegation is visible")
  async expectDelegationInfos(delegationInfo: Delegate) {
    await this.providerIsVisible(delegationInfo);
    await this.amountValueIsVisible(delegationInfo.account.currency.ticker);
    await this.verifyTxTypeIsVisible();
  }
}
