import { Step } from "jest-allure2-reporter/api";

const accountScrollViewId = "account-screen-scrollView";

// Buttons built from ~/components/Button render their testID with an "enabled-"/"disabled-"
// prefix reflecting the disabled state; the amount continue buttons are only tappable once enabled.
const enabled = (id: string) => `enabled-${id}`;

export default class TezosStakePage {
  // Stake flow (TezosStakeFlow)
  stakeAmountInputId = "tezos-stake-amount-input";
  stakeAmountContinueId = "tezos-stake-amount-continue";
  // Unstake flow (TezosUnstakeFlow)
  unstakeAmountInputId = "tezos-unstake-amount-input";
  unstakeAmountContinueId = "tezos-unstake-amount-continue";
  unstakeUnbondingNoticeId = "tezos-unstake-unbonding-notice";
  unstakeStakedBalanceId = "tezos-unstake-staked-balance";
  // Earning-choice chooser (TezosDelegationFlow -> TezosEarnRewards) and the delegation summary it leads to
  earnRewardsStartButtonId = "tezos-earn-rewards-start-button";
  earnRewardsDelegateStepId = "tezos-earn-rewards-delegate-step";
  earnRewardsStakeStepId = "tezos-earn-rewards-stake-step";
  delegationSummaryValidatorId = "tezos-delegation-summary-validator";
  delegationSummaryContinueId = "tezos-summary-continue-button";
  delegationSuccessStakeId = "tezos-delegation-success-stake-button";
  awaitingDelegationId = "tezos-stake-awaiting-delegation";
  // Account staking-section cards (families/tezos/Delegations)
  stakingRowId = "tezos-staking-row";
  delegationRowId = "tezos-delegation-row";
  // DelegationDrawer actions: Touchable sets testID to the analytics event when no explicit testID is given
  stakeMoreActionId = "TezosStakeMore";
  unstakeActionId = "TezosUnstake";
  changeValidatorActionId = "TezosChangeBaker";
  endDelegationActionId = "TezosEndDelegation";
  // Unstake-required guard drawer
  unstakeRequiredTitleId = "tezos-unstake-required-title";
  unstakeRequiredCloseId = "tezos-unstake-required-close";

  @Step("Verify the earning-choice chooser is shown")
  async verifyEarningChoice() {
    // Assert the journey cards, not just the CTA, so this can't pass on the direct stake step.
    await waitForElementById(this.earnRewardsDelegateStepId);
    await waitForElementById(this.earnRewardsStakeStepId);
    await waitForElementById(this.earnRewardsStartButtonId);
  }

  @Step("Start earning from the earning-choice chooser")
  async startEarning() {
    await tapById(this.earnRewardsStartButtonId);
  }

  @Step("Verify the delegation summary is shown")
  async verifyDelegationSummary() {
    await waitForElementById(this.delegationSummaryValidatorId);
  }

  @Step("Continue from the delegation summary")
  async continueFromDelegationSummary() {
    await waitForElementById(enabled(this.delegationSummaryContinueId));
    await tapById(enabled(this.delegationSummaryContinueId));
  }

  @Step("Continue to staking from the delegation success screen")
  async stakeAfterDelegation() {
    await waitForElementById(enabled(this.delegationSuccessStakeId));
    await tapById(enabled(this.delegationSuccessStakeId));
  }

  @Step("Verify the stake step is reached after delegating")
  async verifyStakeStepAfterDelegation() {
    // Broadcast off: the un-broadcast delegation stays "awaiting". Broadcast on (=0): it confirms
    // and the amount input appears. Accept either so the check is broadcast-tolerant.
    try {
      await waitForElementById(this.awaitingDelegationId);
    } catch {
      await waitForElementById(this.stakeAmountInputId);
    }
  }

  @Step("Fill stake amount $0")
  async fillStakeAmount(amount: string) {
    await waitForElementById(this.stakeAmountInputId);
    await typeTextById(this.stakeAmountInputId, amount);
    await waitForElementById(enabled(this.stakeAmountContinueId)); // Issue with RN75 : QAA-370
  }

  @Step("Continue from the stake amount step")
  async continueStakeAmount() {
    await tapById(enabled(this.stakeAmountContinueId));
  }

  @Step("Open the unstake flow from the staking section")
  async openUnstakeFromStakingSection() {
    await scrollToId(this.stakingRowId, accountScrollViewId);
    await tapById(this.stakingRowId);
    await waitForElementById(this.unstakeActionId);
    await tapById(this.unstakeActionId);
  }

  @Step("Verify the unstake amount screen shows the unbonding notice and staked balance")
  async verifyUnstakeAmountInfo() {
    await waitForElementById(this.unstakeUnbondingNoticeId);
    await waitForElementById(this.unstakeStakedBalanceId);
  }

  @Step("Fill unstake amount $0")
  async fillUnstakeAmount(amount: string) {
    await waitForElementById(this.unstakeAmountInputId);
    await typeTextById(this.unstakeAmountInputId, amount);
    await waitForElementById(enabled(this.unstakeAmountContinueId)); // Issue with RN75 : QAA-370
  }

  @Step("Continue from the unstake amount step")
  async continueUnstakeAmount() {
    await tapById(enabled(this.unstakeAmountContinueId));
  }

  @Step("Open change-validator from the delegation section")
  async openChangeValidator() {
    await scrollToId(this.delegationRowId, accountScrollViewId);
    await tapById(this.delegationRowId);
    await waitForElementById(this.changeValidatorActionId);
    await tapById(this.changeValidatorActionId);
  }

  @Step("Open stop-delegation from the delegation section")
  async openStopDelegation() {
    await scrollToId(this.delegationRowId, accountScrollViewId);
    await tapById(this.delegationRowId);
    await waitForElementById(this.endDelegationActionId);
    await tapById(this.endDelegationActionId);
  }

  @Step("Verify the unstake-required guard is shown")
  async verifyUnstakeRequired() {
    await waitForElementById(this.unstakeRequiredTitleId);
    await waitForElementById(this.unstakeRequiredCloseId);
  }

  @Step("Dismiss the unstake-required guard")
  async dismissUnstakeRequired() {
    await tapById(this.unstakeRequiredCloseId);
  }
}
