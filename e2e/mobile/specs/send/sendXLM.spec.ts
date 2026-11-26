import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.XLM_1,
  accountToCredit: Account.XLM_2,
  amount: "0.0001",
  memoTag: "noTag",
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-2813"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@stellar", "@family-stellar"],
});
