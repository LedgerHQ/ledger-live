import {
  expectValidAddressDevice,
  signSendTransaction,
  signDelegationTransaction,
  activateContractData,
  activateExpertMode,
} from "@ledgerhq/live-common/e2e/speculos";
import { TransactionType } from "@ledgerhq/live-common/e2e/models/Transaction";
import { DelegateType } from "@ledgerhq/live-common/e2e/models/Delegate";
import { AccountType } from "@ledgerhq/live-common/e2e/enum/Account";

export default class SpeculosPage {
  @Step("Verify receive address correctness on device")
  async expectValidAddressDevice(account: AccountType, addressDisplayed: string) {
    await expectValidAddressDevice(account, addressDisplayed);
  }

  @Step("Sign Send Transaction on Speculos")
  async signSendTransaction(tx: TransactionType) {
    await signSendTransaction(tx);
  }

  @Step("Sign Delegation Transaction on Speculos")
  async signDelegationTransaction(delegation: DelegateType) {
    await signDelegationTransaction(delegation);
  }

  @Step("Activate contract data on Speculos")
  async activateContractData() {
    await activateContractData();
  }

  @Step("Activate export mode on Speculos")
  async activateExpertMode() {
    await activateExpertMode();
  }
}
