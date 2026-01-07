import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendInvalidAmountTest } from "../send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_2, "100", Fee.MEDIUM);
runSendInvalidAmountTest(
  transaction,
  "Sorry, insufficient funds",
  ["B2CQA-2572"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
);
