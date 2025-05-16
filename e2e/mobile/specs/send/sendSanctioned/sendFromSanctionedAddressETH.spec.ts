import { runSendFromSanctionedAddressTest } from "../send";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

runSendFromSanctionedAddressTest(
  new Transaction(Account.SANCTIONED_ETH, Account.ETH_1, "0.00001", Fee.MEDIUM),
  "Keep you safe",
  "This transaction involves a sanctioned wallet address and cannot be processed.\n-- 0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf",
  ["B2CQA-3536"],
  ["@NanoSP", "@LNS", "@NanoX"],
);
