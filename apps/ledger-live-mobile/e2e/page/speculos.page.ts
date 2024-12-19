import { expectValidAddressDevice } from "@ledgerhq/live-common/e2e/speculos";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export default class SpeculosPage {
  @Step("Verify receive address correctness on device")
  async expectValidAddressDevice(account: Account, addressDisplayed: string) {
    await expectValidAddressDevice(account, addressDisplayed);
  }
}
