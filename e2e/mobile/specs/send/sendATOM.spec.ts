import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.ATOM_1,
  accountToCredit: Account.ATOM_2,
  amount: "0.0001",
  memoTag: "noTag",
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-2814"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@cosmos", "@family-cosmos"],
});
