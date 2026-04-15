import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.ICP_1, Account.ICP_2, "0.001");
runSendTest(
  transaction,
  ["B2CQA-4742"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@internet_computer",
    "@family-internet_computer",
  ],
);
