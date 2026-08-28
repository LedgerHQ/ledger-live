import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.ALGO_1, Account.ALGO_2, "0.001", undefined, "noTag");
runSendTest(
  transaction,
  ["B2CQA-2810"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@algorand", "@family-algorand"],
);
