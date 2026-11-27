import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendValidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.ETH_1,
  accountToCredit: Account.ETH_3,
  amount: "0.00001",
  speed: Fee.MEDIUM,
});
runSendValidAddressTest({
  transaction,
  tmsLinks: ["B2CQA-2714"],
  scenario: "new account",
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
});
