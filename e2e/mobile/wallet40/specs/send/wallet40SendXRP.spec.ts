import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.XRP_1, Account.XRP_2, "0.0001", undefined, "noTag");
runSendTest(
  transaction,
  ["B2CQA-2816"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ripple", "@family-xrp"],
);
