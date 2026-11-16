import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Delegate } from "@ledgerhq/live-e2e-shared/models/Delegate";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

export type DelegateTxType = "Delegated" | "Staked" | "Locked" | "Voted" | "Redelegated";

export class DelegateDrawer extends Drawer {
  private provider = (provider: string) => this.content.getByText(provider).first();
  private amountValue = this.page.getByTestId("amountReceived-drawer").first();
  private transactionType = this.page.getByTestId("transaction-type").first();
  private operationType = this.page.getByTestId("operation-type");
  private accountName = this.page.getByTestId("account-name");

  @step("Verify provider is visible")
  async providerIsVisible(account: Delegate) {
    if (account.account.currency === Currency.ATOM) {
      await this.softExpect(
        async soft => {
          await soft(this.provider(account.provider)).toBeVisible();
        },
        { timeout: TIMEOUT.large },
      );
    }
  }

  @step("Verify validator group $0 is visible")
  async validatorGroupIsVisible(validatorGroup: string) {
    await this.softExpect(async soft => {
      await soft(this.provider(validatorGroup)).toBeVisible();
    });
  }

  @step("Verify amount is visible")
  async amountValueIsVisible(ticker: string) {
    await this.softExpect(async soft => {
      await soft(this.amountValue).toBeVisible();
      await soft(this.amountValue).toContainText(ticker, { useInnerText: true });
    });
  }

  @step("Verify the operation belongs to account $0")
  async verifyAccountName(accountName: string) {
    await this.softExpect(async soft => {
      await soft(this.accountName).toHaveText(accountName);
    });
  }

  @step("Verify transaction type is correct")
  async verifyTxTypeIsVisible() {
    await this.softExpect(async soft => {
      await soft(this.transactionType).toBeVisible();
    });
  }

  @step("Verify transaction type corresponds to $0")
  async verifyTxTypeIs(transactionType: string) {
    await this.softExpect(async soft => {
      await soft(this.transactionType).toHaveText(transactionType, { useInnerText: true });
    });
  }

  @step("Verify operation type corresponds to $0")
  async operationTypeIsCorrect(operationType: string) {
    await this.softExpect(async soft => {
      await soft(this.operationType).toHaveText(operationType, { useInnerText: true });
    });
  }

  @step("Verify the operation drawer shows a $0 operation")
  async verifyOperationType(transactionType: DelegateTxType) {
    await this.waitForDrawerToBeVisible();
    await this.verifyTxTypeIsVisible();
    await this.verifyTxTypeIs(transactionType);
    await this.operationTypeIsCorrect(transactionType);
  }

  @step("Verify the delegation summary of the $1 operation")
  async verifyDelegationSummary(delegation: Delegate, transactionType: DelegateTxType) {
    await this.verifyOperationType(transactionType);
    await this.providerIsVisible(delegation);
    await this.amountValueIsVisible(delegation.account.currency.ticker);
  }

  @step("Verify that the information of the delegation is visible")
  async expectDelegationInfos(delegationInfo: Delegate) {
    await this.waitForDrawerToBeVisible();
    await this.providerIsVisible(delegationInfo);
    await this.amountValueIsVisible(delegationInfo.account.currency.ticker);
    await this.verifyTxTypeIsVisible();
  }
}
