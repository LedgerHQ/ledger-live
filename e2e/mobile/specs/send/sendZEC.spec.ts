import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.ZEC_1,
  accountToCredit: Account.ZEC_2,
  amount: "0.001",
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-4299"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@zcash", "@family-zcash"],
});
