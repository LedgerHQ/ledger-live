import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendENSTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.ETH_1,
  accountToCredit: Account.ETH_2_WITH_ENS,
  amount: "0.0001",
  speed: Fee.MEDIUM,
});
runSendENSTest({
  transaction,
  tmsLinks: ["B2CQA-2202"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
});
