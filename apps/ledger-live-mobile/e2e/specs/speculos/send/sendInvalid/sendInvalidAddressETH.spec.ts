import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendInvalidAddressTest } from "../send";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const transaction = new Transaction(
  Account.ETH_1,
  Account.BTC_NATIVE_SEGWIT_1,
  "0.00001",
  Fee.MEDIUM,
);
runSendInvalidAddressTest(transaction, "This is not a valid Ethereum address", ["B2CQA-2709"]);
