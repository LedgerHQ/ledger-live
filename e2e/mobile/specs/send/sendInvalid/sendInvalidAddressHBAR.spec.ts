import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.HEDERA_1, Account.HEDERA_1, "1", undefined, "noTag");
runSendInvalidAddressTest(
  transaction,
  "Destination and source accounts must not be the same.",
  undefined,
  ["B2CQA-4286"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@hedera", "@family-hedera"],
);
