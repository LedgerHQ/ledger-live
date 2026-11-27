import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.SUI_1,
  accountToCredit: Account.SUI_2,
  amount: "0.0001",
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-3802"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@sui", "@family-sui"],
});
