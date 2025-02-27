import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_2_LOWER_CASE, "0.0001");
runSendValidAddressTest(
  transaction,
  ["B2CQA-2717"],
  undefined,
  "Auto-verification not available: carefully verify the address.",
);
