import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.ZEC_1, Account.ZEC_2, "0.001");
runSendTest(
  transaction,
  ["B2CQA-4299"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@zcash", "@family-zcash"],
);
