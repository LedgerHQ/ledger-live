import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendInvalidAddressTest } from "../send";

const transaction = new Transaction(Account.HEDERA_1, Account.HEDERA_1, "1", undefined, "noTag");
runSendInvalidAddressTest(
  transaction,
  "Destination and source accounts must not be the same.",
  undefined,
  ["B2CQA-4286"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@hedera", "@family-hedera"],
);
