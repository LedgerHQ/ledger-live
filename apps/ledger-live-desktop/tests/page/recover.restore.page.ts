import { sendDeepLink } from "../utils/deeplink";
import { AppPage } from "tests/page/abstractClasses";

export class RecoverRestorePage extends AppPage {
  readonly deepLink = "ledgerlive://recover-restore-flow";
  readonly connectText = this.page.locator("data-test-id=recover-restore-connect-text");

  useDeepLink() {
    return sendDeepLink(this.page, this.deepLink);
  }
}
