import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.ALGO_1, Account.ALGO_2, "0.001", undefined, "noTag");
runSendTest(
  transaction,
  ["B2CQA-2810"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@algorand", "@family-algorand"],
);
