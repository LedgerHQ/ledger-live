import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_3, "0.00001", Fee.SLOW);
runSendTest(
  transaction,
  ["B2CQA-2574"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
);
