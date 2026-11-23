import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidAmountTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.DOT_1, Account.DOT_3, "0.5");
runSendInvalidAmountTest({
  transaction,
  expectedErrorMessage: "Minimum of 1 DOT needed to activate recipient address",
  tmsLinks: ["B2CQA-2570"],
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
