import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidAmountTest } from "@e2e/specs/send/send";

const transaction = new Transaction(
  Account.HEDERA_1,
  Account.HEDERA_2,
  "100000",
  undefined,
  "noTag",
);
runSendInvalidAmountTest({
  transaction,
  expectedErrorMessage: "Sorry, insufficient funds",
  tmsLinks: ["B2CQA-4287"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@hedera", "@family-hedera"],
});
