import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.ALGO_1,
  accountToCredit: Account.ALGO_2,
  amount: "0.001",
  memoTag: "noTag",
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-2810"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@algorand",
    "@family-algorand",
  ],
});
