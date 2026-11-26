import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidAmountTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.ETH_1,
  accountToCredit: Account.ETH_2,
  amount: "100",
  speed: Fee.MEDIUM,
});
runSendInvalidAmountTest({
  transaction,
  expectedErrorMessage: "Sorry, insufficient funds",
  tmsLinks: ["B2CQA-2572"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
});
