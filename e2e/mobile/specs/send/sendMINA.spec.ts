import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

// Mina 4 and Mina 5 are kept out of the staking pool, so a broadcasting night never sends two
// transactions from one account. Desktop sends the other way around, to share the fees.
const transaction = new Transaction(Account.MINA_5, Account.MINA_4, "0.01");
runSendTest(
  transaction,
  ["B2CQA-4778"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@mina", "@family-mina"],
);
