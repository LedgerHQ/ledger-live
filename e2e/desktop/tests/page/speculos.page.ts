import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";
import {
  activateLedgerSync,
  expectValidAddressDevice,
  signSendTransaction,
  signSendNFTTransaction,
  signDelegationTransaction,
  verifyAmountsAndAcceptSwap,
  verifyAmountsAndRejectSwap,
  activateExpertMode,
  activateContractData,
  removeMemberLedgerSync,
} from "@ledgerhq/live-common/e2e/speculos";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { NFTTransaction, Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";

import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
export class SpeculosPage extends AppPage {
  @step("Verify receive address correctness on device")
  async expectValidAddressDevice(account: Account, addressDisplayed: string) {
    await expectValidAddressDevice(account, addressDisplayed);
  }

  @step("Remove member from Ledger Sync")
  async removeMemberFromLedgerSync() {
    await removeMemberLedgerSync();
  }

  @step("Activate Ledger Sync")
  async activateLedgerSync() {
    await activateLedgerSync();
  }

  @step("Sign Send NFT Transaction")
  async signSendNFTTransaction(tx: NFTTransaction) {
    await signSendNFTTransaction(tx);
  }

  @step("Sign Send Transaction")
  async signSendTransaction(tx: Transaction) {
    await signSendTransaction(tx);
  }

  @step("Sign Delegation Transaction")
  async signDelegationTransaction(delegatingAccount: Delegate) {
    await signDelegationTransaction(delegatingAccount);
  }

  @step("Verify amounts and accept swap")
  async verifyAmountsAndAcceptSwap(swap: Swap, amount: string) {
    await verifyAmountsAndAcceptSwap(swap, amount);
  }

  @step("Verify amounts and reject swap")
  async verifyAmountsAndRejectSwap(swap: Swap, amount: string) {
    await verifyAmountsAndRejectSwap(swap, amount);
  }

  @step("Activate expert mode")
  async activateExpertMode() {
    await activateExpertMode();
  }

  @step("Activate contract data")
  async activateContractData() {
    await activateContractData();
  }
}
