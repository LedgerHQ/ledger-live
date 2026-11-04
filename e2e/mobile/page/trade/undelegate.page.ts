import { Step } from "jest-allure2-reporter/api";
import invariant from "invariant";
import { byId } from "@e2e/helpers/elements/native";

// The delegation drawer's action ids are not namespaced per currency: sui exposes
// `StakingActionUnstake`, while `DelegationActionUndelegate` is shared by cosmos, cardano, EVM,
// MultiversX and mina. Resolve them per currency here rather than letting specs pass raw ids.
const DELEGATION_ACTION_IDS: Record<string, { unstake: string; redelegate?: string }> = {
  sui: { unstake: "StakingActionUnstake" },
  mina: { unstake: "DelegationActionUndelegate", redelegate: "DelegationActionRedelegate" },
};

export default class UndelegatePage {
  private readonly accountScrollView = byId("account-screen-scrollView");
  // Families that hold several positions index their rows; those that delegate once do not.
  private readonly stakingRow = (currencyId: string, rowIndex?: number) =>
    byId(
      rowIndex === undefined
        ? `${currencyId}-staking-row`
        : `${currencyId}-staking-row-${rowIndex}`,
    );
  private readonly amountInput = (currencyId: string) =>
    byId(`${currencyId}-delegation-amount-input`);
  private readonly amountContinue = (currencyId: string) =>
    byId(`enabled-${currencyId}-delegation-amount-continue`);

  @Step("Tap staking position row to open delegation drawer {{{0}}}")
  async tapStakingRow(currencyId: string, rowIndex?: number) {
    const stakingRow = this.stakingRow(currencyId, rowIndex);
    await this.accountScrollView.waitVisible();
    await stakingRow.scrollTo(this.accountScrollView);
    await stakingRow.tap();
  }

  @Step("Tap unstake action for {{{0}}} in delegation drawer")
  async tapUnstakeAction(currencyId: string) {
    await this.tapDelegationAction(currencyId, "unstake");
  }

  @Step("Tap redelegate action for {{{0}}} in delegation drawer")
  async tapRedelegateAction(currencyId: string) {
    await this.tapDelegationAction(currencyId, "redelegate");
  }

  private async tapDelegationAction(currencyId: string, action: "unstake" | "redelegate") {
    const actionId = DELEGATION_ACTION_IDS[currencyId]?.[action];
    invariant(actionId, `No ${action} action id mapped for currency "${currencyId}"`);
    await byId(actionId).tap();
  }

  @Step("Enter unstake amount {{{1}}}")
  async enterAmount(currencyId: string, amount: string) {
    await this.amountInput(currencyId).replaceText(amount);
    await this.amountContinue(currencyId).waitVisible();
  }

  @Step("Continue from amount step {{{0}}}")
  async continueFromAmount(currencyId: string) {
    await this.amountContinue(currencyId).tap();
  }
}
