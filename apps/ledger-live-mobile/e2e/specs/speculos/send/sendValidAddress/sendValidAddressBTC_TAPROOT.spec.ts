import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendValidAddressTest } from "../send";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const transaction = new Transaction(
  Account.BTC_TAPROOT_1,
  Account.BTC_TAPROOT_2,
  "0.00001",
  Fee.MEDIUM,
);
runSendValidAddressTest(transaction, ["B2CQA-2725"]);
