import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidAmountTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_2, "100", Fee.MEDIUM);
runSendInvalidAmountTest({
  transaction,
  expectedErrorMessage: "Sorry, insufficient funds",
  tmsLinks: ["B2CQA-2572"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
});
