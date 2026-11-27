import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.APTOS_1,
  accountToCredit: Account.APTOS_2,
  amount: "0.0001",
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-2920"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@aptos", "@family-aptos"],
});
