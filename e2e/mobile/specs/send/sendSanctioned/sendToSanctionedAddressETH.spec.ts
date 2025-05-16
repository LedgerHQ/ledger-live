import { runSendToSanctionedAddressTest } from "../send";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

runSendToSanctionedAddressTest(
  new Transaction(Account.ETH_1, Account.SANCTIONED_ETH, "0.00001", Fee.MEDIUM),
  "Keep you safe",
  "This transaction involves a sanctioned wallet address and cannot be processed.\n-- 0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf",
  ["B2CQA-3537"],
  ["@NanoSP", "@LNS", "@NanoX"],
);
