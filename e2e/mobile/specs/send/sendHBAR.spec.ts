import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(
  Account.HEDERA_1,
  Account.HEDERA_2,
  "0.0001",
  undefined,
  "noTag",
);
runSendTest(
  transaction,
  ["B2CQA-4285"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@hedera", "@family-hedera"],
);
