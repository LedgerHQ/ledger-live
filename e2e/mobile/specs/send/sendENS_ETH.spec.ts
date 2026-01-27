import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendENSTest } from "./send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_2_WITH_ENS, "0.0001", Fee.MEDIUM);
runSendENSTest(
  transaction,
  ["B2CQA-2202"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
);
