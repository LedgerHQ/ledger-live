import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.KASPA_1, Account.KASPA_2, "0.2");
runSendTest(
  transaction,
  ["B2CQA-3840"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@kaspa", "@family-kaspa"],
);
