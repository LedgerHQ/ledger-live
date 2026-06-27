import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidAmountTest } from "../send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_2, "", Fee.MEDIUM);
runSendInvalidAmountTest(
  transaction,
  "",
  ["B2CQA-2568"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
);
