import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { BroadcastFlow } from "@e2e/helpers/broadcastRotation";
import { runSendTest } from "@e2e/specs/send/send";

// Mina 4 and Mina 5 are kept out of the staking pool, so a broadcasting night never sends two
// transactions from one account. Desktop sends the other way around, to share the fees.
const transaction = new Transaction({
  accountToDebit: Account.MINA_5,
  accountToCredit: Account.MINA_4,
  amount: "0.01",
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-4778"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@mina", "@family-mina"],
  sharedAccountFlow: BroadcastFlow.MINA_SEND,
});
