import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

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
