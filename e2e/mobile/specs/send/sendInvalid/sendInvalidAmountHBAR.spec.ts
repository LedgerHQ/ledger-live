import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendInvalidAmountTest } from "../send";

const transaction = new Transaction(
  Account.HEDERA_1,
  Account.HEDERA_2,
  "100000",
  undefined,
  "noTag",
);
runSendInvalidAmountTest(
  transaction,
  "Sorry, insufficient funds",
  ["B2CQA-4287"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@hedera", "@family-hedera"],
);
