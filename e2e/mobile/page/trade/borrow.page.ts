import { Step } from "jest-allure2-reporter/api";

export default class BorrowPage {
  private readonly borrowScreenId = "borrow-screen";

  // Mirrors borrow-live-app packages/features/src/testIds.ts
  private readonly introModalId = "borrow-intro-modal";
  private readonly introModalTitleId = "borrow-intro-modal-title";

  @Step("Expect borrow native screen visible")
  async expectBorrowScreenVisible() {
    await waitForElementById(this.borrowScreenId);
    await waitForElementById(app.common.walletApiWebview, undefined, { checkVisibility: false });
    await waitForWebviewContentToRender();
  }

  @Step("Expect the Introducing Crypto Loan modal")
  async expectIntroModal() {
    await waitWebElementByTestId(this.introModalId);
    await detoxExpect(getWebElementByTestId(this.introModalId)).toExist();
    await detoxExpect(getWebElementByTestId(this.introModalTitleId)).toExist();
  }
}
