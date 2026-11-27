import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.KASPA_1,
  accountToCredit: Account.KASPA_2,
  amount: "0.2",
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-3840"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@kaspa", "@family-kaspa"],
});
