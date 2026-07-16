import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidAmountTest } from "../send";

const transaction = new Transaction(Account.XRP_1, Account.XRP_3, "0.1", undefined, "noTag");
runSendInvalidAmountTest(
  transaction,
  "Minimum of 1 XRP needed to activate recipient address",
  ["B2CQA-2571"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ripple", "@family-xrp"],
);
