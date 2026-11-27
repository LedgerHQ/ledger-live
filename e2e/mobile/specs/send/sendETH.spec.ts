import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.ETH_1,
  accountToCredit: Account.ETH_3,
  amount: "0.00001",
  speed: Fee.SLOW,
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-2574"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
});
