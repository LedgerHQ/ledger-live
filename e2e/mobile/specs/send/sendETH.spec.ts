import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_3, "0.00001", Fee.SLOW);
runSendTest(
  transaction,
  ["B2CQA-2574"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
);
