import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.TRX_1,
  accountToCredit: Account.TRX_2,
  amount: "0.01",
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-2812"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@tron", "@family-tron"],
});
