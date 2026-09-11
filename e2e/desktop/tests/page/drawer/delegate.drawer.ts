import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Delegate } from "@ledgerhq/live-e2e-shared/models/Delegate";
import { expect } from "@playwright/test";

export class DelegateDrawer extends Drawer {
  private provider = (provider: string) => this.content.getByText(provider).first();
  private amountValue = this.page.getByTestId("amountReceived-drawer").first();
  private transactionType = this.page.getByTestId("transaction-type").first();
  private operationType = this.page.getByTestId("operation-type");
  private accountName = this.page.getByTestId("account-name");

  @step("Verify provider is visible")
  async providerIsVisible(account: Delegate) {
    if (account.account.currency === Currency.ATOM) {
      await expect(this.provider(account.provider)).toBeVisible();
    }
  }

  @step("Verify validator group $0 is visible")
  async validatorGroupIsVisible(validatorGroup: string) {
    await expect(this.provider(validatorGroup)).toBeVisible();
  }

  @step("Verify amount is visible")
  async amountValueIsVisible(ticker: string) {
    await expect(this.amountValue).toBeVisible();
    const displayedAmount = await this.amountValue.innerText();
    expect(displayedAmount).toEqual(expect.stringContaining(ticker));
  }

  @step("Verify the operation belongs to account $0")
  async verifyAccountName(accountName: string) {
    await expect(this.accountName).toHaveText(accountName);
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
