import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(
  Account.BTC_SEGWIT_1,
  Account.BTC_SEGWIT_2,
  "0.00001",
  Fee.MEDIUM,
);
runSendValidAddressTest(transaction, ["B2CQA-2723"], "Segwit");
