import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.SOL_1,
  accountToCredit: Account.SOL_2,
  amount: "0.000001",
  memoTag: "noTag",
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-2811"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@solana", "@family-solana"],
});
