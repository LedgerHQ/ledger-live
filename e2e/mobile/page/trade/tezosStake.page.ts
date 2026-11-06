import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

// Buttons built from ~/components/Button render their testID with an "enabled-"/"disabled-"
// prefix reflecting the disabled state; the amount continue buttons are only tappable once enabled.
const enabled = (id: string) => `enabled-${id}`;

export default class TezosStakePage {
  private readonly accountScrollView = byId("account-screen-scrollView");
  private readonly genericErrorModal = byId(app.common.errorPage.genericErrorModalId);
  // Stake flow (TezosStakeFlow)
  private readonly stakeAmountInput = byId("tezos-stake-amount-input");
  private readonly stakeAmountContinue = byId(enabled("tezos-stake-amount-continue"));
  // Unstake flow (TezosUnstakeFlow)
  private readonly unstakeAmountInput = byId("tezos-unstake-amount-input");
  private readonly unstakeAmountContinue = byId(enabled("tezos-unstake-amount-continue"));
  private readonly unstakeUnbondingNotice = byId("tezos-unstake-unbonding-notice");
  private readonly unstakeStakedBalance = byId("tezos-unstake-staked-balance");
  // Earning-choice chooser (TezosDelegationFlow -> TezosEarnRewards) and the delegation summary it leads to
  private readonly earnRewardsStartButton = byId("tezos-earn-rewards-start-button");
  private readonly earnRewardsDelegateStep = byId("tezos-earn-rewards-delegate-step");
  private readonly earnRewardsStakeStep = byId("tezos-earn-rewards-stake-step");
  private readonly delegationSummaryValidator = byId("tezos-delegation-summary-validator");
  private readonly delegationSummaryContinue = byId(enabled("tezos-summary-continue-button"));
  private readonly delegationSuccessStake = byId(enabled("tezos-delegation-success-stake-button"));
  private readonly awaitingDelegation = byId("tezos-stake-awaiting-delegation");
  // Account staking-section cards (families/tezos/Delegations)
  private readonly stakingRow = byId("tezos-staking-row");
  private readonly delegationRow = byId("tezos-delegation-row");
  // DelegationDrawer actions: Touchable sets testID to the analytics event when no explicit testID is given
  private readonly unstakeAction = byId("TezosUnstake");
  private readonly changeValidatorAction = byId("TezosChangeBaker");
  private readonly endDelegationAction = byId("TezosEndDelegation");
  // Unstake-required guard drawer
  private readonly unstakeRequiredTitle = byId("tezos-unstake-required-title");
  private readonly unstakeRequiredClose = byId("tezos-unstake-required-close");

  @Step("Verify the earning-choice chooser is shown")
  async verifyEarningChoice() {
    // Assert the journey cards, not just the CTA, so this can't pass on the direct stake step.
    await this.earnRewardsDelegateStep.waitVisible();
    await this.earnRewardsDelegateStep.expectVisible();
    await this.earnRewardsStakeStep.waitVisible();
    await this.earnRewardsStakeStep.expectVisible();
    await this.earnRewardsStartButton.waitVisible();
    await this.earnRewardsStartButton.expectVisible();
  }

  @Step("Start earning from the earning-choice chooser")
  async startEarning() {
    await this.earnRewardsStartButton.tap();
  }

  @Step("Verify the delegation summary is shown")
  async verifyDelegationSummary() {
    await this.delegationSummaryValidator.waitVisible();
    await this.delegationSummaryValidator.expectVisible();
  }

  @Step("Continue from the delegation summary")
  async continueFromDelegationSummary() {
    await this.delegationSummaryContinue.tap();
  }

  @Step("Verify the delegation success screen is shown")
  async verifyDelegationSuccess() {
    await this.delegationSuccessStake.waitVisible(TIMEOUT.xxlarge, this.genericErrorModal);
    await this.delegationSuccessStake.expectVisible();
  }

  @Step("Continue to staking from the delegation success screen")
  async stakeAfterDelegation() {
    await this.delegationSuccessStake.tap();
  }

  @Step("Verify the delegation is awaiting confirmation")
  async verifyAwaitingDelegation() {
    await this.awaitingDelegation.waitVisible();
    await this.awaitingDelegation.expectVisible();
  }

  @Step("Fill stake amount {{{0}}}")
  async fillStakeAmount(amount: string) {
    await this.stakeAmountInput.replaceText(amount);
    await this.stakeAmountContinue.waitVisible(); // Issue with RN75 : QAA-370
  }

  @Step("Continue from the stake amount step")
  async continueStakeAmount() {
    await this.stakeAmountContinue.tap();
  }

  @Step("Open the unstake flow from the staking section")
  async openUnstakeFromStakingSection() {
    await this.stakingRow.scrollTo(this.accountScrollView);
    await this.stakingRow.tap();
    await this.unstakeAction.tap();
  }

  @Step("Verify the unstake amount screen shows the unbonding notice and staked balance")
  async verifyUnstakeAmountInfo() {
    await this.unstakeUnbondingNotice.waitVisible();
    await this.unstakeUnbondingNotice.expectVisible();
    await this.unstakeStakedBalance.waitVisible();
    await this.unstakeStakedBalance.expectVisible();
  }

  @Step("Fill unstake amount {{{0}}}")
  async fillUnstakeAmount(amount: string) {
    await this.unstakeAmountInput.replaceText(amount);
    await this.unstakeAmountContinue.waitVisible(); // Issue with RN75 : QAA-370
  }

  @Step("Continue from the unstake amount step")
  async continueUnstakeAmount() {
    await this.unstakeAmountContinue.tap();
  }

  @Step("Open change-validator from the delegation section")
  async openChangeValidator() {
    await this.delegationRow.scrollTo(this.accountScrollView);
    await this.delegationRow.tap();
    await this.changeValidatorAction.tap();
  }

  @Step("Open stop-delegation from the delegation section")
  async openStopDelegation() {
    await this.delegationRow.scrollTo(this.accountScrollView);
    await this.delegationRow.tap();
    await this.endDelegationAction.tap();
  }

  @Step("Verify the unstake-required guard is shown")
  async verifyUnstakeRequired() {
    await this.unstakeRequiredTitle.waitVisible();
    await this.unstakeRequiredTitle.expectVisible();
    await this.unstakeRequiredClose.waitVisible();
    await this.unstakeRequiredClose.expectVisible();
  }

  @Step("Dismiss the unstake-required guard")
  async dismissUnstakeRequired() {
    await this.unstakeRequiredClose.tap();
  }
}
