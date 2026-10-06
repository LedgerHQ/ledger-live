import { Step } from "jest-allure2-reporter/api";
import { TIMEOUT } from "@e2e/utils/timeouts";

/** The Device Intent Executor drawer that signs a wallet-api transaction (llmWalletApiDeviceIntentSign). */
export default class WalletApiSignatureDrawer {
  contentId = "wallet-api-signature-step";

  @Step("Expect the wallet-api signature drawer visible")
  async expectVisible() {
    await waitForElementById(this.contentId, TIMEOUT.xlarge);
  }
}
