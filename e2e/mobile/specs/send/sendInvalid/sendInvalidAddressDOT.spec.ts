import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.DOT_1, Account.DOT_1, "0.5");
runSendInvalidAddressTest({
  transaction,
  expectedErrorMessage: "Destination and source accounts must not be the same.",
  scenario: "same as sender",
  tmsLinks: ["B2CQA-2711"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@assethub_polkadot",
    "@family-polkadot",
  ],
});
