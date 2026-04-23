import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.SUI_1, Account.SUI_2, "0.0001");
runSendTest(
  transaction,
  ["B2CQA-3802"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@sui", "@family-sui"],
);
