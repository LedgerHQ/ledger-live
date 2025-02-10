import {
  expectValidAddressDevice,
  signSendTransaction,
  signDelegationTransaction,
  activateContractData,
} from "@ledgerhq/live-common/e2e/speculos";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";

export default class SpeculosPage {
  @Step("Verify receive address correctness on device")
  async expectValidAddressDevice(account: Account, addressDisplayed: string) {
    await expectValidAddressDevice(account, addressDisplayed);
  }

  @Step("Sign Send Transaction")
  async signSendTransaction(tx: Transaction) {
    await signSendTransaction(tx);
  }

  @Step("Sign Delegation Transaction")
  async signDelegationTransaction(delegation: Delegate) {
    await signDelegationTransaction(delegation);
  }

  @Step("Activate contract data")
  async activateContractData() {
    await activateContractData();
  }
}
