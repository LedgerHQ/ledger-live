import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.ATOM_1, Account.ATOM_1, "0.00001");
runSendInvalidAddressTest({
  transaction,
  expectedErrorMessage: "Destination and source accounts must not be the same.",
  scenario: "same as sender",
  tmsLinks: ["B2CQA-2713"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@cosmos", "@family-cosmos"],
});
