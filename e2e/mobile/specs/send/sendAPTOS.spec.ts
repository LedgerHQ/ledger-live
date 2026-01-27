import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.APTOS_1, Account.APTOS_2, "0.0001");
runSendTest(
  transaction,
  ["B2CQA-2920"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@aptos", "@family-aptos"],
);
