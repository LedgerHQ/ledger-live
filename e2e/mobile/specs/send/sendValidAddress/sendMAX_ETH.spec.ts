import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendMaxTest } from "../send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_2, "max", Fee.MEDIUM);
runSendMaxTest(
  transaction,
  ["B2CQA-473"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
);
