import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.BCH_1, Account.BCH_2, "0.0001", Fee.SLOW);
runSendTest(
  transaction,
  ["B2CQA-2808"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bitcoin_cash", "@family-bitcoin"],
);
