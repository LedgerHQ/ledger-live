import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

/** The Device Intent Executor drawer that signs a wallet-api transaction (llmWalletApiDeviceIntentSign). */
export default class WalletApiSignatureDrawer {
  private readonly signaturePrompt = byId("wallet-api-signature-prompt");

  @Step("Expect the wallet-api signature drawer visible")
  async expectVisible() {
    await this.signaturePrompt.waitFullyVisible(TIMEOUT.xlarge);
  }
}
