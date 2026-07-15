import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";

export class TezosEarningChoiceModal extends Modal {
  private readonly delegateButton = this.page.getByTestId("tezos-earn-choice-delegate-button");
  private readonly stakeButton = this.page.getByTestId("tezos-earn-choice-stake-button");

  @step("Choose Delegate on the earning-choice modal")
  async chooseDelegate() {
    await this.delegateButton.click();
  }

  @step("Choose Stake on the earning-choice modal")
  async chooseStake() {
    await this.stakeButton.click();
  }
}
