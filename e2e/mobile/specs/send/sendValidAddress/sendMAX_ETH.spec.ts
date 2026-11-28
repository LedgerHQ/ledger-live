import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendMaxTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.ETH_1,
  accountToCredit: Account.ETH_2,
  amount: "max",
  speed: Fee.MEDIUM,
});
runSendMaxTest({
  transaction,
  tmsLinks: ["B2CQA-6124"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
});
