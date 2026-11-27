import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.POL_1,
  accountToCredit: Account.POL_2,
  amount: "0.001",
  speed: Fee.SLOW,
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-2807"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@polygon", "@family-evm"],
});
