import { Step } from "jest-allure2-reporter/api";
import { TIMEOUT } from "@e2e/utils/timeouts";

/** The Device Intent Executor drawer that signs a wallet-api transaction (llmWalletApiDeviceIntentSign). */
export default class WalletApiSignatureDrawer {
  signaturePromptId = "wallet-api-signature-prompt";

  @Step("Expect the wallet-api signature drawer visible")
  async expectVisible() {
    await waitForFullyVisibleById(this.signaturePromptId, TIMEOUT.xlarge);
  }
}
